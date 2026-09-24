import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { validateFocusedSourceTestPair } from "../../../../src/checks/general/E-1/validate-focused-source-test-pair.mjs";

test("accepts a valid focused source/test pair", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-pair-"));
  await mkdir(join(root, "src"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "src", "module.mjs"), "export {};\n");
  await writeFile(join(root, "tests", "module.test.mjs"), 'import "../src/module.mjs"; test("ok", () => {});\n');
  await expect(validateFocusedSourceTestPair(root, {
    sourcePath: "src/module.mjs",
    testPath: "tests/module.test.mjs",
  })).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});

test("reports missing, mismatched, and malformed focused pairs", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-pair-"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "tests", "other.test.mjs"), "const x = 1;\n");
  await expect(validateFocusedSourceTestPair(root, {
    sourcePath: "src/module.mjs",
    testPath: "tests/other.test.mjs",
  })).resolves.toEqual(expect.arrayContaining([
    "missing mirrored source: module.mjs",
    expect.stringContaining("do not mirror"),
    "other.test.mjs does not reference an implementation module",
  ]));
  await expect(validateFocusedSourceTestPair(root, {
    sourcePath: "src/module.mjs",
    testPath: "tests/missing.test.mjs",
  })).resolves.toEqual(["Focused test file is missing: missing.test.mjs"]);
  await rm(root, { recursive: true, force: true });
});
