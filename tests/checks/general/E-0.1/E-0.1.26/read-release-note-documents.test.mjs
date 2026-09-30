import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { readReleaseNoteDocuments } from "../../../../../src/checks/general/E-0.1/E-0.1.26/read-release-note-documents.mjs";

async function withRepository(files, run) {
  const root = await mkdtemp(join(tmpdir(), "eliware-release-documents-"));
  await Promise.all(
    Object.entries(files).map(async ([name, content]) => {
      await mkdir(root, { recursive: true });
      await writeFile(join(root, name), content);
    }),
  );
  try {
    await run({ root });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("loads the release notes and README used by release validation", async () => {
  await withRepository({ "RELEASE_NOTES.md": "notes", "README.md": "readme" }, async (context) => {
    await expect(readReleaseNoteDocuments(context)).resolves.toEqual({
      notes: "notes",
      readme: "readme",
      failures: [],
    });
  });
});

test("reports every missing release document", async () => {
  await withRepository({}, async (context) => {
    await expect(readReleaseNoteDocuments(context)).resolves.toEqual({
      notes: undefined,
      readme: undefined,
      failures: [
        "RELEASE_NOTES.md is required for application and library repositories.",
        "README.md is required for release-note validation.",
      ],
    });
  });
});

test("skips release-note and README checks for profiles that do not require notes", async () => {
  await withRepository({ "README.md": "readme" }, async (context) => {
    await expect(readReleaseNoteDocuments(context, false)).resolves.toEqual({
      notes: undefined,
      readme: undefined,
      failures: [],
    });
  });
});
