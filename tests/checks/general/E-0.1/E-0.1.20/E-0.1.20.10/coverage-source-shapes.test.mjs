import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import {
  expectedCoverageShape,
  readExpectedCoverageShapes,
} from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-source-shapes.mjs";

test("derives expected statement, branch, and function maps from source", () => {
  const shape = expectedCoverageShape(
    "export function decide(value) { if (value) return 1; return 0; }",
    "src/decision.mjs",
  );
  expect(Object.keys(shape.statementMap).length).toBeGreaterThan(0);
  expect(Object.keys(shape.branchMap).length).toBeGreaterThan(0);
  expect(Object.keys(shape.fnMap).length).toBeGreaterThan(0);
});

test("reuses the instrumenter without mutating previously derived coverage shapes", () => {
  const first = expectedCoverageShape("export const first = 1;", "src/first.mjs");
  const firstStatementIds = Object.keys(first.statementMap);
  expectedCoverageShape("export const second = 2;", "src/second.mjs");

  expect(Object.keys(first.statementMap)).toEqual(firstStatementIds);
  expect(first.fnMap).toBeDefined();
});

test.each([
  ["TypeScript", "export const value: number = 1;"],
  ["JSX", "export const view = <main />;"],
])("instruments supported %s source syntax", (_syntax, source) => {
  const shape = expectedCoverageShape(source, "src/example.js");
  expect(Object.keys(shape.statementMap)).toHaveLength(1);
});

test("reads source shapes only for in-scope source files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-coverage-shapes-"));
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "example.mjs"), "export const value = 1;\n");
  const shapes = await readExpectedCoverageShapes(root, [
    "src/example.mjs",
    "tests/example.test.mjs",
    "README.md",
  ]);
  expect(Object.keys(shapes)).toEqual(["src/example.mjs"]);
  expect(Object.keys(shapes["src/example.mjs"].statementMap)).toHaveLength(1);
  await rm(root, { recursive: true, force: true });
});
