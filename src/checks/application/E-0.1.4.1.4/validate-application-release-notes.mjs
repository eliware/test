import { join } from "node:path";
import { readRepositoryText } from "../../../orchestration/read-repository-text.mjs";
import { validateReleaseNotesContent } from "./validate-release-notes-content.mjs";
import { validateReleaseNotesLink } from "./validate-release-notes-link.mjs";

export async function validateApplicationReleaseNotes(context = {}) {
  const root = context.root ?? process.cwd();
  let content;
  try {
    content = await readRepositoryText(context, join(root, "RELEASE_NOTES.md"));
  } catch {
    return ["RELEASE_NOTES.md is required."];
  }
  const readme = await readRepositoryText(context, join(root, "README.md")).catch(() => "");
  return [...validateReleaseNotesContent(content), ...validateReleaseNotesLink(readme)];
}
