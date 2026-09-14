import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectJsonFiles } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/collect-json-files.mjs";

test("collects sorted JSON files while excluding generated directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-json-"));
  await mkdir(join(root, "coverage"));
  await writeFile(join(root, "z.json"), "{}");
  await writeFile(join(root, "a.json"), "{}");
  await writeFile(join(root, "coverage", "ignored.json"), "{}");
  expect(await collectJsonFiles(root)).toEqual([join(root, "a.json"), join(root, "z.json")]);
});
