import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import {
  expectedCoverageShape,
  readExpectedCoverageShapes,
} from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/coverage-source-shapes.mjs";

test("derives expected statement, branch, and function maps from source", () => {
  const shape = expectedCoverageShape(
    "export function decide(value) { if (value) return 1; return 0; }",
    "src/decision.mjs",
  );
  expect(Object.keys(shape.statementMap).length).toBeGreaterThan(0);
  expect(Object.keys(shape.branchMap).length).toBeGreaterThan(0);
  expect(Object.keys(shape.fnMap).length).toBeGreaterThan(0);
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
