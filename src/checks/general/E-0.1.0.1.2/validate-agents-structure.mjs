import { removeMarkdownCode } from "../E-0.1.0.1.4/extract-markdown-links.mjs";
import { readCanonicalOrder } from "../../../validation/shared/conventions/read-canonical-order.mjs";

export function validateAgentsStructure(
  content,
  packageJson = {},
  specificationHeadings = new Set(),
) {
  const firstContentLine = content.split(/\r?\n/u).find((line) => line.trim() !== "");
  if (firstContentLine !== "# AGENTS.md") return ["AGENTS.md must begin with # AGENTS.md."];
  const markdown = removeMarkdownCode(content);
  const lines = markdown.split(/\r?\n/u);
  const actual = lines.filter((line) => /^##\s+/u.test(line)).map((line) => line.slice(3).trim());
  const order = readCanonicalOrder("agents-sections.yaml");
  const baseSections = order.baseSections;
  if (baseSections.some((section, index) => actual[index] !== section))
    return ["AGENTS.md must begin with the seven required headings in order."];
  const applied = new Set(packageJson?.eliware?.apply ?? []);
  const expectedProfiles = order.profileOrder
    .filter((profile) => applied.has(profile))
    .map((profile) => order.profileHeadings[profile]);
  const profileHeadings = Object.values(order.profileHeadings);
  const profileSet = new Set(profileHeadings);
  const remaining = actual.slice(baseSections.length);
  const profileCount = remaining.filter((heading) => profileSet.has(heading)).length;
  if (
    remaining
      .slice(0, expectedProfiles.length)
      .some((heading, index) => heading !== expectedProfiles[index])
  )
    return ["AGENTS.md profile headings must use canonical order after Changes."];
  const extras = remaining.slice(expectedProfiles.length);
  if (
    profileCount !== expectedProfiles.length ||
    new Set(actual).size !== actual.length ||
    extras.some((heading) => profileSet.has(heading) || !specificationHeadings.has(heading))
  )
    return ["AGENTS.md has duplicate, undeclared, or misordered section headings."];
  return [];
}
