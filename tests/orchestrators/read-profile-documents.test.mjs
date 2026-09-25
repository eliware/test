import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { readProfileDocuments } from "../../src/orchestrators/read-profile-documents.mjs";

test("reads profile JSON in sorted order and excludes maintenance documents", async () => {
  const directory = await mkdtemp(join(tmpdir(), "eliware-profile-documents-"));
  await writeFile(join(directory, "zeta.json"), '{"name":"zeta"}');
  await writeFile(join(directory, "alpha.json"), '{"name":"alpha"}');
  await writeFile(join(directory, "authority.json"), "{}");
  await writeFile(join(directory, "notes.md"), "ignored");
  await mkdir(join(directory, "nested"));

  expect(readProfileDocuments(directory)).toEqual([
    { source: "alpha.json", document: { name: "alpha" } },
    { source: "zeta.json", document: { name: "zeta" } },
  ]);
  await rm(directory, { recursive: true, force: true });
});
