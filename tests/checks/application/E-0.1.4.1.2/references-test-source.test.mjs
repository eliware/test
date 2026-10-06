import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { referencesTestSource } from "../../../../src/checks/application/E-0.1.4.1.2/references-test-source.mjs";

test.each(['import "../src/a.mjs";', "await import(`../src/a.mjs`);"])(
  "detects a static source reference: %s",
  (content) => {
    const ast = parse(content, { sourceType: "unambiguous" });
    expect(referencesTestSource(ast.program, "tests/a.test.mjs", "src/a.mjs")).toBe(true);
  },
);

test("rejects CommonJS source references", () => {
  const ast = parse('require("../src/a.mjs");', { sourceType: "unambiguous" });
  expect(referencesTestSource(ast.program, "tests/a.test.mjs", "src/a.mjs")).toBe(false);
});

test("rejects a computed source reference", () => {
  const ast = parse("await import(`../src/${name}.mjs`);", { sourceType: "module" });
  expect(referencesTestSource(ast.program, "tests/a.test.mjs", "src/a.mjs")).toBe(false);
});
