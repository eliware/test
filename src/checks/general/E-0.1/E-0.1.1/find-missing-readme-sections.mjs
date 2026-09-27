import { expectedReadmeHeadings } from "./resolve-readme-headings.mjs";

export function findMissingReadmeSections(sections, packageJson = {}) {
  return expectedReadmeHeadings(packageJson).filter(
    (section) => section !== "Table of Contents" && !sections.get(section),
  );
}
