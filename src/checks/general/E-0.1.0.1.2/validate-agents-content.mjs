const requiredMarkers = [
  "Node.js 26",
  "native ESM",
  "npm test",
  "npm run lint",
  "npm run audit",
  "npm run format",
  "npm run format:check",
];

export function validateAgentsContent(content) {
  const missing = requiredMarkers.filter((marker) => !content.includes(marker));
  return missing.length ? [`AGENTS.md must include: ${missing.join(", ")}.`] : [];
}
