const requiredSections = [
  "Project",
  "Scope and boundaries",
  "Layout",
  "Development",
  "Validation",
  "Security",
  "Changes",
];
const profileHeadings = {
  application: "Application", cli: "CLI", discord: "Discord", "mcp-server": "MCP server",
  web: "Web", library: "Library", infrastructure: "Infrastructure", workspace: "Workspace",
  documentation: "Documentation", "npm-published": "npm publication",
  "ghcr-published": "GHCR publication", private: "Private distribution",
};

export function findMissingAgentsSections(content, packageJson = {}) {
  const lines = content.split(/\r?\n/);
  const firstContentIndex = lines.findIndex((line) => line.trim() !== "");
  if (firstContentIndex < 0 || lines[firstContentIndex] !== "# AGENTS.md") return ["# AGENTS.md", ...requiredSections];
  const indices = requiredSections.map((section) => lines.findIndex((line) => line === `## ${section}`));
  const missing = requiredSections.filter((section, index) => indices[index] < 0 || (index > 0 && indices[index] <= indices[index - 1]));
  if (missing.length > 0) return missing;
  const applied = new Set(packageJson?.eliware?.apply ?? []);
  const expected = [...requiredSections.map((section) => `## ${section}`), ...Object.entries(profileHeadings)
    .filter(([profile]) => applied.has(profile)).map(([, heading]) => `## ${heading}`)];
  const actual = content.split(/\r?\n/u).filter((line) => /^##\s+/u.test(line));
  return JSON.stringify(actual) === JSON.stringify(expected) ? [] : ["canonical profile section order or undeclared section"];
}

export { requiredSections };
