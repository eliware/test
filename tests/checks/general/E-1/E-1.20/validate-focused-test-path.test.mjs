import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateFocusedTestPath } from "../../../../../src/checks/general/E-1/E-1.20/validate-focused-test-path.mjs";

test("validates focused test paths before execution", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-test-"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "tests", "sample.test.mjs"), "test(\"sample\", () => {});");
  await expect(validateFocusedTestPath(root)).resolves.toBeNull();
  await expect(validateFocusedTestPath(root, ["tests/sample.test.mjs"])).resolves.toBe("tests/sample.test.mjs");
  await expect(validateFocusedTestPath(root, ["tests/missing.test.mjs"])).rejects.toThrow("does not exist");
  await rm(root, { recursive: true, force: true });
});
