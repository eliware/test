import { expect, test } from "@jest/globals";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateProfileDocumentPairs } from "../../../../src/checks/general/E-0.1.0.1.0/validate-profile-document-pairs.mjs";

test("accepts a missing conventions directory", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-pair-"));
  try {
    expect(await validateProfileDocumentPairs(root)).toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports paired version and prerequisite mismatches", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-pair-"));
  const directory = join(root, "specs", "conventions");
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(join(directory, "general-semantic.yaml"), "version: '12.0'\nrequires: []\n");
    await writeFile(
      join(directory, "general-deterministic.yaml"),
      "version: '11.0'\nrequires: [application]\n",
    );
    expect(await validateProfileDocumentPairs(root)).toEqual([
      "general semantic and deterministic documents must use the same version.",
      "general semantic and deterministic documents must use the same prerequisites.",
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("ignores unmatched profiles and unrelated files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-pair-"));
  const directory = join(root, "specs", "conventions");
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(join(directory, "general-semantic.yaml"), "version: '12.0'\nrequires: []\n");
    await writeFile(join(directory, "README.md"), "index\n");
    expect(await validateProfileDocumentPairs(root)).toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
