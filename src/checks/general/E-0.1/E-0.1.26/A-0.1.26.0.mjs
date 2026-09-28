import { readRepositoryText } from "../../../read-repository-text.mjs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { parseReleaseNotes } from "./parse-release-notes.mjs";
import { validateReleaseNoteContent } from "./validate-release-note-content.mjs";
import { validateReleaseNoteOrder } from "./validate-release-note-order.mjs";
import { validateReadmeReleaseNotesLink } from "./validate-readme-release-notes-link.mjs";

export const ruleId = "A-0.1.26.0";
export const parentRuleId = "E-0.1.26";

export async function run(context) {
  const { root, packageJson } = context;
  const failures = [];
  let notes;
  let readme;
  try {
    notes = await readFile(join(root, "RELEASE_NOTES.md"), "utf8");
  } catch {
    failures.push("RELEASE_NOTES.md is required for release-bearing repositories.");
  }
  try {
    readme = await readRepositoryText(context, join(root, "README.md"));
  } catch {
    failures.push("README.md is required for release-bearing repositories.");
  }
  if (notes !== undefined) {
    const parsed = parseReleaseNotes(notes);
    if (parsed.error) failures.push(`RELEASE_NOTES.md ${parsed.error}`);
    const contentError = validateReleaseNoteContent(parsed.entries, packageJson?.version);
    if (contentError) failures.push(`RELEASE_NOTES.md ${contentError}`);
    const orderError = validateReleaseNoteOrder(parsed.entries);
    if (orderError) failures.push(`RELEASE_NOTES.md ${orderError}`);
  }
  if (readme !== undefined) {
    const linkError = validateReadmeReleaseNotesLink(readme);
    if (linkError) failures.push(linkError);
  }
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
