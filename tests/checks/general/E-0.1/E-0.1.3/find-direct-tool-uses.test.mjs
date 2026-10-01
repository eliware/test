import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { findDirectToolUses } from "../../../../../src/checks/general/E-0.1/E-0.1.3/find-direct-tool-uses.mjs";

test("finds direct commands and imports on validation surfaces", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-direct-tools-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "custom-script.mjs"), "import 'jest';\n");
  await writeFile(join(root, "workflow.yml"), "run: npx oxlint .\n");
  await expect(findDirectToolUses(root)).resolves.toEqual(["custom-script.mjs", "workflow.yml"]);
  await rm(root, { recursive: true, force: true });
});

test("does not treat documentation prose as tool use", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-direct-tools-"));
  await writeFile(join(root, "README.md"), "Do not run jest directly.\n");
  await expect(findDirectToolUses(root)).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});

test("does not treat structured metadata values as commands", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-direct-tools-metadata-"));
  await writeFile(
    join(root, "repo-map.yaml"),
    'keywords: "jest, oxlint, prettier"\ndescription: "testing with Jest"\n',
  );
  await expect(findDirectToolUses(root)).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});

test("does not report clean inspectable files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-direct-tools-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "clean.mjs"), "export const value = 1;\n");
  await expect(findDirectToolUses(root, ["src/clean.mjs"])).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});

test("ignores package metadata and non-validation files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-direct-tools-"));
  await writeFile(join(root, "package.json"), '{"description":"jest"}\n');
  await writeFile(join(root, "notes.txt"), "import jest from 'jest';\n");
  await expect(findDirectToolUses(root, ["package.json", "notes.txt"])).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});

test("routes JavaScript modules through syntax analysis", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-direct-tools-"));
  await mkdir(join(root, "src"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "src", "tool.mjs"), "import oxlint from 'oxlint';\n");
  await writeFile(
    join(root, "tests", "sample.test.mjs"),
    'import { jest } from "@jest/globals";\n',
  );
  await expect(
    findDirectToolUses(root, ["src/tool.mjs", "tests/sample.test.mjs"]),
  ).resolves.toEqual(["src/tool.mjs"]);
  await rm(root, { recursive: true, force: true });
});

test("uses run-scoped text reads when provided", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-direct-tools-inventory-"));
  const readText = jest.fn(async () => "import 'jest';\n");
  await expect(findDirectToolUses(root, ["src/tool.mjs"], readText)).resolves.toEqual([
    "src/tool.mjs",
  ]);
  expect(readText).toHaveBeenCalledWith(join(root, "src/tool.mjs"));
  await rm(root, { recursive: true, force: true });
});
