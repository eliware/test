import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanCommonJsFiles } from "../../../../../src/checks/general/E-1/E-1.20/scan-commonjs-files.mjs";

test("scans module files and reports CommonJS extensions", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-commonjs-scan-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "legacy.cjs"), "module.exports = {};" );
  await expect(scanCommonJsFiles(root)).resolves.toEqual(["src/legacy.cjs: CommonJS module extension"]);
  await rm(root, { recursive: true, force: true });
});
