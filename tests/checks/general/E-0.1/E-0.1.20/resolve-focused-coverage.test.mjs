import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveFocusedCoverage } from "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-focused-coverage.mjs";

test("maps an existing mirrored test to its source coverage", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-test-"));
  await mkdir(join(root, "src"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "src", "sample.mjs"), "export {};");
  await writeFile(join(root, "tests", "sample.test.mjs"), 'test("sample", () => {});');
  await expect(resolveFocusedCoverage(root, "tests/sample.test.mjs")).resolves.toEqual([
    "--collectCoverageFrom",
    "src/sample.mjs",
  ]);
  await expect(resolveFocusedCoverage(root, "tests\\sample.test.mjs")).resolves.toEqual([
    "--collectCoverageFrom",
    "src/sample.mjs",
  ]);
  await rm(root, { recursive: true, force: true });
});

test("maps .mts and .cts tests to the native ESM source module", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-typed-test-"));
  await mkdir(join(root, "src"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "src", "sample.mjs"), "export {};");
  for (const extension of ["mts", "cts"]) {
    await writeFile(join(root, "tests", `sample.test.${extension}`), 'test("sample", () => {});');
    await expect(resolveFocusedCoverage(root, `tests/sample.test.${extension}`)).resolves.toEqual([
      "--collectCoverageFrom",
      "src/sample.mjs",
    ]);
  }
  await rm(root, { recursive: true, force: true });
});

test("ignores aggregate and non-test arguments", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-test-"));
  await expect(resolveFocusedCoverage(root, null)).resolves.toEqual([]);
  await expect(resolveFocusedCoverage(root, "README.md")).resolves.toEqual([]);
  await expect(resolveFocusedCoverage(root, "tests/sample.mjs")).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});

test("maps spec paths and propagates non-missing filesystem errors", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-test-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "specimen.mjs"), "export {};");
  await expect(resolveFocusedCoverage(root, "specs/specimen.spec.mjs")).resolves.toEqual([
    "--collectCoverageFrom",
    "src/specimen.mjs",
  ]);
  const fileRoot = join(root, "not-a-directory");
  await writeFile(fileRoot, "file");
  await expect(resolveFocusedCoverage(fileRoot, "tests/missing.test.mjs")).rejects.toThrow();
  await rm(root, { recursive: true, force: true });
});

test("fails focused coverage when the mirrored source does not exist", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-test-"));
  await expect(resolveFocusedCoverage(root, "tests/missing.test.mjs")).rejects.toThrow(
    "Focused test has no mirrored source file: src/missing.mjs.",
  );
  await rm(root, { recursive: true, force: true });
});
