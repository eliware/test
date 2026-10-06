import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { readProfileDocuments } from "../../src/orchestrators/read-profile-documents.mjs";

test("reads profile YAML in sorted order and excludes maintenance documents", async () => {
  const directory = await mkdtemp(join(tmpdir(), "eliware-profile-documents-"));
  await writeFile(join(directory, "zeta-semantic.yaml"), '{"name":"zeta"}');
  await writeFile(join(directory, "alpha-deterministic.yaml"), '{"name":"alpha"}');
  await writeFile(join(directory, "alpha-semantic.yaml"), '{"name":"alpha"}');
  await writeFile(join(directory, "directives.yaml"), "{}");
  await writeFile(join(directory, "notes.md"), "ignored");
  await mkdir(join(directory, "nested"));

  expect(readProfileDocuments(directory)).toEqual([
    { source: "alpha-deterministic.yaml", document: { name: "alpha" } },
    { source: "alpha-semantic.yaml", document: { name: "alpha" } },
    { source: "zeta-semantic.yaml", document: { name: "zeta" } },
  ]);
  await rm(directory, { recursive: true, force: true });
});
