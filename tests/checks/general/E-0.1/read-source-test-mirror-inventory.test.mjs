import { expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readSourceTestMirrorInventory } from "../../../../src/checks/general/E-0.1/read-source-test-mirror-inventory.mjs";

test("projects src and tests files and directories from the repository inventory", async () => {
  const entriesUnder = jest.fn(async (directory) =>
    directory.endsWith("src")
      ? [
          { path: "src/nested", type: "directory" },
          { path: "src/nested/module.mjs", type: "file" },
          { path: "src/other.txt", type: "file" },
        ]
      : [
          { path: "tests/nested", type: "directory" },
          { path: "tests/nested/module.test.mjs", type: "file" },
        ],
  );

  await expect(readSourceTestMirrorInventory("/repo", { entriesUnder })).resolves.toEqual({
    sourceFiles: ["nested/module.mjs", "other.txt"],
    testFiles: ["nested/module.test.mjs"],
    sourceDirectories: ["nested"],
    testDirectories: ["nested"],
  });
  expect(entriesUnder).toHaveBeenCalledTimes(2);
});

test("collects the source and test trees when no inventory is supplied", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mirror-inventory-"));
  await mkdir(join(root, "src", "nested"), { recursive: true });
  await mkdir(join(root, "tests", "nested"), { recursive: true });
  await writeFile(join(root, "src", "nested", "module.mjs"), "export {};\n");
  await writeFile(join(root, "tests", "nested", "module.test.mjs"), "test('ok', () => {});\n");
  try {
    await expect(readSourceTestMirrorInventory(root)).resolves.toEqual({
      sourceFiles: ["nested/module.mjs"],
      testFiles: ["nested/module.test.mjs"],
      sourceDirectories: ["nested"],
      testDirectories: ["nested"],
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
