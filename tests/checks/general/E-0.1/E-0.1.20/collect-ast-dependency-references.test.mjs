import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectAstReferences } from "../../../../../src/checks/general/E-0.1/E-0.1.20/collect-ast-dependency-references.mjs";

function collect(source, declared = ["alpha", "beta"]) {
  const referenced = new Set();
  const uncertain = { value: false };
  collectAstReferences(
    parse(source, { sourceType: "module", createImportExpressions: true }).program,
    declared,
    referenced,
    uncertain,
  );
  return { referenced: [...referenced], uncertain: uncertain.value };
}

test("collects references recursively across static, dynamic, and resolver syntax", () => {
  expect(
    collect(`
      import "alpha";
      export { value } from "beta/subpath";
      import("alpha/lazy");
      require.resolve("beta/package.json");
      resolvePackage("alpha/package.json");
    `),
  ).toEqual({ referenced: ["alpha", "beta"], uncertain: false });
});

test("marks dynamic import calls uncertain when their expression may name a dependency", () => {
  expect(collect('import("alpha/" + suffix);')).toEqual({ referenced: [], uncertain: true });
  expect(collect('import("unrelated/" + suffix);')).toEqual({ referenced: [], uncertain: false });
});

test("ignores require calls shadowed in their lexical scope", () => {
  expect(collect('require("alpha"); function nested(require) { require("beta"); }')).toEqual({
    referenced: ["alpha"],
    uncertain: false,
  });
});

test("ignores require.resolve calls shadowed in their lexical scope", () => {
  expect(collect('function nested(require) { require.resolve("beta/package.json"); }')).toEqual({
    referenced: [],
    uncertain: false,
  });
});

test("ignores absent, primitive, and location metadata nodes", () => {
  const referenced = new Set();
  const uncertain = { value: false };
  collectAstReferences(null, ["alpha"], referenced, uncertain);
  collectAstReferences(1, ["alpha"], referenced, uncertain);
  const program = parse("", { sourceType: "module" }).program;
  program.loc = {
    type: "BlockStatement",
    body: [{ type: "ImportDeclaration", source: { value: "alpha" } }],
  };
  program.body.push(null, "not-an-ast-node");
  collectAstReferences(program, ["alpha"], referenced, uncertain);
  collectAstReferences(program, ["alpha"], referenced);
  expect(referenced).toEqual(new Set());
  expect(uncertain.value).toBe(false);
});
