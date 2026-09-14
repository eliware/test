import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanDependencyFiles } from "../../../../../src/checks/general/E-1/E-1.20/scan-dependency-files.mjs";

test("scans source and structured dependency references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-dependency-scan-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "module.mjs"), "import x from 'dep'; export { x };");
  await writeFile(join(root, "package.json"), JSON.stringify({ dependencies: { dep: "1.0.0" } }));
  const referenced = new Set();
  const uncertain = { value: false };
  await scanDependencyFiles(root, ["dep"], referenced, uncertain);
  expect(referenced.has("dep")).toBe(true);
  await rm(root, { recursive: true, force: true });
});
