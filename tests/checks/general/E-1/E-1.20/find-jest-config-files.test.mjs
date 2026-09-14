import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findJestConfigFiles } from "../../../../../src/checks/general/E-1/E-1.20/find-jest-config-files.mjs";

test("finds separate Jest configurations and skips excluded directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-jest-config-"));
  await mkdir(join(root, "nested"));
  await mkdir(join(root, "node_modules"));
  await writeFile(join(root, "jest.config.mjs"), "export default {};\n");
  await writeFile(join(root, "nested", "notes.txt"), "not a config\n");
  await writeFile(join(root, "node_modules", "jest.config.js"), "module.exports = {};\n");
  await expect(findJestConfigFiles(root)).resolves.toEqual([join(root, "jest.config.mjs")]);
  await rm(root, { recursive: true, force: true });
});
