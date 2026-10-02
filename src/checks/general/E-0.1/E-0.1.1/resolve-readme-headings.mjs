import { readFileSync } from "node:fs";
import { parse } from "yaml";

const conventionPath = new URL("../../../../../specs/conventions/general.yaml", import.meta.url);
const convention = parse(readFileSync(conventionPath, "utf8"));
const headingTable = resolveReadmeHeadingTable(convention);

export function resolveReadmeHeadingTable(document) {
  const table = findDirective(document?.directives, "E-0.1.1.0")?.examples?.find(
    ({ purpose }) => purpose === "Canonical README heading table",
  );
  if (!Array.isArray(table?.generalHeadings) || !table?.profileHeadings)
    throw new Error("general.yaml must define the canonical README heading table.");
  return table;
}

export const requiredReadmeSections = headingTable.generalHeadings;

export function expectedReadmeHeadings(packageJson = {}) {
  const applied = new Set(packageJson?.eliware?.apply ?? []);
  const extensions = Object.entries(headingTable.profileHeadings).flatMap(([profile, headings]) =>
    applied.has(profile) ? headings : [],
  );
  const uniqueExtensions = extensions.filter(
    (section, index) => extensions.indexOf(section) === index,
  );
  const securityIndex = requiredReadmeSections.indexOf("Security") + 1;
  return [
    "Table of Contents",
    ...requiredReadmeSections.slice(0, securityIndex),
    ...uniqueExtensions,
    ...requiredReadmeSections.slice(securityIndex),
  ];
}

export function readmeSectionsCacheKey(packageJson = {}) {
  return `readme:sections:${JSON.stringify(packageJson?.eliware?.apply ?? [])}`;
}

function findDirective(directives, id) {
  for (const directive of directives ?? []) {
    if (directive.id === id) return directive;
    const nested = findDirective(directive.directives, id);
    if (nested) return nested;
  }
  return null;
}
