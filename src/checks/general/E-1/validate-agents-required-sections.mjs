const requiredSections = [
  "Instruction scope",
  "Read before changing",
  "Authoritative sources",
  "Repository identity",
  "Scope and boundaries",
  "Required structure",
  "Security and secrets",
  "Validation",
  "Approved deviations",
  "Change control and authorization",
  "Subdirectory instructions",
];

export function findMissingAgentsSections(content) {
  return requiredSections.filter((section) => !new RegExp(`^#{1,6}\\s+${section}\\s*$`, "im").test(content));
}

export { requiredSections };
