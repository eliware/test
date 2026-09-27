import { join } from "node:path";
import { readRepositoryParsed, readRepositoryText } from "../../../read-repository-text.mjs";
import { readReadmeSections } from "./read-readme-sections.mjs";
import { expectedReadmeHeadings, readmeSectionsCacheKey } from "./resolve-readme-headings.mjs";

export async function loadReadmeValidationInputs(context) {
  const { root, packageJson } = context;
  const readmePath = join(root, "README.md");
  let readme;
  try {
    readme = await readRepositoryText(context, readmePath);
  } catch {
    return null;
  }
  const sections = await readRepositoryParsed(
    context,
    readmePath,
    readmeSectionsCacheKey(packageJson),
    (content) => readReadmeSections(content, expectedReadmeHeadings(packageJson)),
  );
  return { readme, sections };
}
