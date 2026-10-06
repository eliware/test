const requiredSections = [
  "Project",
  "Scope and boundaries",
  "Layout",
  "Development",
  "Validation",
  "Security",
  "Changes",
];
const profileHeadings = [
  ["documentation", "Documentation"],
  ["workspace", "Workspace"],
  ["library", "Library"],
  ["application", "Application"],
  ["cli", "CLI"],
  ["web", "Web"],
  ["discord", "Discord"],
  ["mcp-server", "MCP server"],
  ["infrastructure", "Infrastructure"],
  ["npm-published", "npm publication"],
  ["ghcr-published", "GHCR publication"],
  ["private", "Private distribution"],
];
const profileSet = new Set(profileHeadings.map(([, heading]) => heading));

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
  if (requiredSections.some((section, index) => actual[index] !== section))
    return ["AGENTS.md must begin with the seven required headings in order."];
  const applied = new Set(packageJson?.eliware?.apply ?? []);
  const expectedProfiles = profileHeadings
    .filter(([profile]) => applied.has(profile))
    .map(([, heading]) => heading);
  const remaining = actual.slice(requiredSections.length);
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
import { removeMarkdownCode } from "../E-0.1.0.1.4/extract-markdown-links.mjs";
