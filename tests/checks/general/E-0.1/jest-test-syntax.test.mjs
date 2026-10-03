import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import {
  collectApiNames,
  isExecutableTestCall,
  isMockCall,
  isRequireCall,
  staticString,
  visitAst,
} from "../../../../src/checks/general/E-0.1/jest-test-syntax.mjs";

test("recognizes Jest API aliases and supported executable call forms", () => {
  const ast = parse(
    `
      import { test as check, it as verify, jest as testApi } from "@jest/globals";
      import { test as unrelated } from "other-package";
      test("global", () => {});
      check.only("alias", () => {});
      check["only"]("computed alias", () => {});
      verify.each([1])("row", () => {});
      check.skip.each([1])("skipped", () => {});
      check.todo("todo");
      unrelated("not Jest", () => {});
      getRunner().test("not Jest", () => {});
      createRunner()("not Jest", () => {});
      new Runner()("not Jest", () => {});
      check("missing callback");
      check("invalid callback", "text");
      check.concurrent?.("optional", () => {});
      testApi.unstable_mockModule("./module.mjs", () => ({}));
      jest.mock(\`./static.mjs\`, () => ({}));
      other.mock("./unrelated.mjs", () => ({}));
      require("./module.mjs");
      import(\`./static.mjs\`);
      import(\`./\${name}.mjs\`);
      import(specifier);
    `,
    { sourceType: "module" },
  );
  const { jestNames, testNames } = collectApiNames(ast);
  const calls = [];
  visitAst(ast, (node) => {
    if (node.type === "CallExpression" || node.type === "OptionalCallExpression") calls.push(node);
  });
  expect(jestNames).toContain("testApi");
  expect(testNames).toEqual(new Set(["test", "it", "check", "verify"]));
  const declarations = calls.map((call) => isExecutableTestCall(call, testNames));
  expect(declarations).toContain(true);
  expect(declarations).toContain(false);
  expect(calls.map((call) => isRequireCall(call.callee))).toContain(true);
  expect(calls.map((call) => isMockCall(call.callee, jestNames))).toContain(true);
  expect(calls.map((call) => isMockCall(call.callee, new Set()))).not.toContain(true);
});

test("parses literal module specifiers and safely visits null and array entries", () => {
  const ast = parse('import "./module.mjs"; import(`./template.mjs`); import(`./${name}.mjs`);', {
    sourceType: "module",
  });
  const strings = [];
  visitAst([null, ast], (node) => {
    if (node.type === "ImportDeclaration") strings.push(staticString(node.source));
    if (node.type === "TemplateLiteral") strings.push(staticString(node));
  });
  expect(strings).toEqual(["./module.mjs", "./template.mjs", null]);
  expect(staticString(undefined)).toBeNull();
});
