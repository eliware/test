import { expect, jest, test } from "@jest/globals";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readSourceTestContents } from "../../../../src/checks/general/E-0.1/read-source-test-test-contents.mjs";

test("reads only Jest test files through the run inventory", async () => {
  const readText = jest.fn(async () => "test('ok', () => {});");
  const contents = await readSourceTestContents("/repo", ["helper.mjs", "nested/module.test.mjs"], {
    readText,
  });

  expect(contents).toEqual(new Map([["nested/module.test.mjs", "test('ok', () => {});"]]));
  expect(readText).toHaveBeenCalledWith(join("/repo", "tests", "nested/module.test.mjs"));
});

test("reads test files from disk when no inventory is supplied", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mirror-test-contents-"));
  await mkdir(join(root, "tests"), { recursive: true });
  await writeFile(join(root, "tests", "example.test.mjs"), "test('ok', () => {});\n");
  try {
    await expect(readSourceTestContents(root, ["example.test.mjs"])).resolves.toEqual(
      new Map([["example.test.mjs", "test('ok', () => {});\n"]]),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
