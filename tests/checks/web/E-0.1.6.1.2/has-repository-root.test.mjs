import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { hasRepositoryRoot } from "../../../../src/checks/web/E-0.1.6.1.2/has-repository-root.mjs";

test("accepts a root derived from import.meta.url with imported aliases", () => {
  const program = parse(
    'import { dirname as getDirectory } from "node:path"; import { fileURLToPath as toPath } from "node:url"; const root = getDirectory(toPath(import.meta.url));',
    { sourceType: "module" },
  ).program;
  expect(hasRepositoryRoot(program, "root", "getDirectory", "toPath")).toBe(true);
});

test("rejects roots that do not derive from import.meta.url", () => {
  const program = parse('const root = "src";', { sourceType: "module" }).program;
  expect(hasRepositoryRoot(program, "root", "dirname", "fileURLToPath")).toBe(false);
});

test("rejects missing path helper imports", () => {
  const program = parse("const root = {};", { sourceType: "module" }).program;
  expect(hasRepositoryRoot(program, "root", null, null)).toBe(false);
});
