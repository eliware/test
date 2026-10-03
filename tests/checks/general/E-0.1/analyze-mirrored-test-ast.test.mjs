import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { inspectMirroredTestAst } from "../../../../src/checks/general/E-0.1/analyze-mirrored-test-ast.mjs";

test("collects test declarations and source references from executable syntax", () => {
  const ast = parse(
    `
      import { test as check, it as verify, jest as mocked } from "@jest/globals";
      import "./static.mjs";
      export * from "./star.mjs";
      export { value } from "./named.mjs";
      import("./dynamic.mjs");
      test("global", () => {});
      check["only"]("selected", function () {});
      verify.each([1])("each", () => {});
      check("works", () => require("./required.mjs"));
      mocked.unstable_mockModule("./mocked.mjs", () => ({}));
      jest.mock(\`./template.mjs\`, () => ({}));
      other.mock("./unrelated.mjs", () => ({}));
      check.skip.each([1])("skipped", () => {});
      check("missing callback");
      check("invalid callback", "text");
      getRunner().test("unrelated", () => {});
      new Runner()("unrelated", () => {});
      import(\`./interpolated/\${name}.mjs\`);
      import(name);
      require();
    `,
    { sourceType: "module" },
  );
  const evidence = inspectMirroredTestAst(ast);
  expect(evidence.hasExecutableTest).toBe(true);
  expect(evidence.moduleSpecifiers).toEqual(
    expect.arrayContaining([
      "@jest/globals",
      "./static.mjs",
      "./star.mjs",
      "./named.mjs",
      "./dynamic.mjs",
      "./required.mjs",
      "./mocked.mjs",
      "./template.mjs",
      null,
    ]),
  );
});

test("ignores empty AST entries while inspecting module and test evidence", () => {
  expect(inspectMirroredTestAst([null])).toEqual({
    hasExecutableTest: false,
    moduleSpecifiers: [],
  });
});
