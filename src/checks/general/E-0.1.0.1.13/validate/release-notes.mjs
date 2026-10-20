import { join } from "node:path";
import { readRepositoryText } from "../../../../validation/shared/repository/read/repository-text.mjs";
import { releaseEntryHeadings, validateReleaseNotesContent } from "./release/notes/content.mjs";
import { validateReleaseNotesLink } from "./release/notes/link.mjs";
import { validateReleaseTagVersions } from "./release/validate-release-tags.mjs";

export async function validateReleaseNotes(context = {}, dependencies = {}) {
  const root = context.root ?? process.cwd();
  let content;
  try {
    content = await readRepositoryText(context, join(root, "RELEASE_NOTES.md"));
  } catch {
    return ["RELEASE_NOTES.md is required."];
  }
  const readme = await readRepositoryText(context, join(root, "README.md")).catch(() => "");
  const packageVersion = context.packageJson?.version;
  const runGit = context.runGit ?? dependencies.runGit;
  return [
    ...validateReleaseNotesContent(content, packageVersion),
    ...(await validateReleaseTagVersions(
      root,
      releaseEntryHeadings(content),
      packageVersion,
      runGit,
    )),
    ...validateReleaseNotesLink(readme),
  ];
}
