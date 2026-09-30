import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { readRepositoryText } from "../../../read-repository-text.mjs";

export async function readReleaseNoteDocuments(context, releaseNotesRequired = true) {
  if (!releaseNotesRequired) return { notes: undefined, readme: undefined, failures: [] };
  const { root } = context;
  const failures = [];
  let notes;
  let readme;
  try {
    notes = await readFile(join(root, "RELEASE_NOTES.md"), "utf8");
  } catch {
    failures.push("RELEASE_NOTES.md is required for application and library repositories.");
  }
  try {
    readme = await readRepositoryText(context, join(root, "README.md"));
  } catch {
    failures.push("README.md is required for release-note validation.");
  }
  return { notes, readme, failures };
}
