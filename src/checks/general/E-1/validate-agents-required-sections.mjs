const requiredSections = [
  "Project",
  "Scope and boundaries",
  "Layout",
  "Development",
  "Validation",
  "Security",
  "Changes",
];

export function findMissingAgentsSections(content) {
  const lines = content.split(/\r?\n/);
  const firstContentIndex = lines.findIndex((line) => line.trim() !== "");
  if (firstContentIndex < 0 || lines[firstContentIndex] !== "# AGENTS.md") return ["# AGENTS.md", ...requiredSections];
  const indices = requiredSections.map((section) => lines.findIndex((line) => line === `## ${section}`));
  return requiredSections.filter((section, index) => indices[index] < 0 || (index > 0 && indices[index] <= indices[index - 1]));
}

export { requiredSections };
