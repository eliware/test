import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { findDirectToolUses } from "../../../../../src/checks/general/E-1/E-1.3/find-direct-tool-uses.mjs";

test("finds direct commands and imports on validation surfaces", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-direct-tools-"));
  await writeFile(join(root, "validate.mjs"), "import 'jest';\n");
  await writeFile(join(root, "workflow.yml"), "run: npx oxlint .\n");
  await expect(findDirectToolUses(root)).resolves.toEqual(["validate.mjs", "workflow.yml"]);
  await rm(root, { recursive: true, force: true });
});

test("does not treat documentation prose as tool use", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-direct-tools-"));
  await writeFile(join(root, "README.md"), "Do not run jest directly.\n");
  await expect(findDirectToolUses(root)).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});
