import { expectedReadmeHeadings } from "./read-readme-sections.mjs";

export function findMissingReadmeSections(sections, packageJson = {}) {
  return expectedReadmeHeadings(packageJson).filter(
    (section) => section !== "Table of Contents" && !sections.get(section),
  );
}
