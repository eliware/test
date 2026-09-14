export const requiredReadmeSections = [
  "Purpose", "Requirements", "Setup", "Configuration", "Usage",
  "Validation", "Operations", "Security", "Support", "License",
];

export function readReadmeSections(readme) {
  const lines = readme.split(/\r?\n/);
  return new Map(requiredReadmeSections.map((section) => {
    const headingIndex = lines.findIndex((line) => new RegExp(`^#{1,6}\\s+${section}\\b`, "i").test(line));
    if (headingIndex < 0) return [section, ""];
    const end = lines.findIndex((line, index) => index > headingIndex && /^#{1,6}\s+\S/.test(line));
    return [section, lines.slice(headingIndex + 1, end < 0 ? lines.length : end).join("\n").trim()];
  }));
}
