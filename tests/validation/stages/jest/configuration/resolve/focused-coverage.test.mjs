import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const access = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ access }));

const { resolveFocusedCoverage } =
  await import("../../../../../../src/validation/stages/jest/configuration/resolve/focused-coverage.mjs");

const root = "C:/repo";

beforeEach(() => access.mockReset().mockResolvedValue(undefined));

test("maps mirrored tests across root, case, and separator variants", async () => {
  for (const focusedPath of [
    "tests/sample.test.mjs",
    "tests\\sample.test.mjs",
    "test/sample.test.mjs",
    "Tests/sample.test.mjs",
  ]) {
    await expect(resolveFocusedCoverage(root, focusedPath)).resolves.toEqual([
      "--collectCoverageFrom",
      "src/sample.mjs",
    ]);
  }
  expect(access).toHaveBeenCalledWith(join(root, "src", "sample.mjs"));
});

test("selects coverage for each focused test source", async () => {
  await expect(
    resolveFocusedCoverage(root, ["tests/one.test.mjs", "tests/nested/two.spec.mjs"]),
  ).resolves.toEqual([
    "--collectCoverageFrom",
    "src/one.mjs",
    "--collectCoverageFrom",
    "src/nested/two.mjs",
  ]);
});

test("maps typed tests to native ESM sources and preserves other extensions", async () => {
  const focusedPaths = ["tests/sample.test.mts", "tests/sample.test.cts"];
  await expect(resolveFocusedCoverage(root, focusedPaths)).resolves.toEqual([
    "--collectCoverageFrom",
    "src/sample.mjs",
    "--collectCoverageFrom",
    "src/sample.mjs",
  ]);
  for (const extension of ["js", "jsx", "ts", "tsx", "mjs", "cjs"]) {
    await expect(resolveFocusedCoverage(root, `tests/example.test.${extension}`)).resolves.toEqual([
      "--collectCoverageFrom",
      `src/example.${extension}`,
    ]);
  }
});

test("ignores aggregate and non-test arguments", async () => {
  await expect(resolveFocusedCoverage(root, null)).resolves.toEqual([]);
  await expect(resolveFocusedCoverage(root, "README.md")).resolves.toEqual([]);
  await expect(resolveFocusedCoverage(root, "tests/sample.mjs")).resolves.toEqual([]);
  await expect(resolveFocusedCoverage(root, "specs/sample.spec.mjs")).resolves.toEqual([]);
  expect(access).not.toHaveBeenCalled();
});

test("rejects focused tests without a mirrored source file", async () => {
  access.mockRejectedValue(new Error("missing source"));

  await expect(resolveFocusedCoverage(root, "tests/missing.test.mjs")).rejects.toThrow(
    "Focused test has no mirrored source file: src/missing.mjs.",
  );
});
