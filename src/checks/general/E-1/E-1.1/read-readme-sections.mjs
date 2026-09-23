export const requiredReadmeSections = [
  "Features", "Requirements", "Setup", "Usage", "Development", "Testing",
  "Troubleshooting", "Security", "Support", "License", "Links",
];

const profileSections = {
  application: ["Configuration", "Operations"],
  cli: ["Commands", "Exit codes"],
};

export function expectedReadmeHeadings(packageJson = {}) {
  const applied = new Set(packageJson?.eliware?.apply ?? []);
  const extensions = ["application", "cli"].flatMap((profile) =>
    applied.has(profile) ? profileSections[profile] : [],
  );
  return ["Table of Contents", ...requiredReadmeSections.slice(0, 8), ...extensions,
    ...requiredReadmeSections.slice(8)];
}

export function readReadmeSections(readme, packageJson = {}) {
  const lines = readme.split(/\r?\n/);
  return new Map(expectedReadmeHeadings(packageJson).map((section) => {
    const headingIndex = lines.findIndex((line) => new RegExp(`^#{1,6}\\s+${section}\\b`, "i").test(line));
    if (headingIndex < 0) return [section, ""];
    const end = lines.findIndex((line, index) => index > headingIndex && /^#{1,6}\s+\S/.test(line));
    return [section, lines.slice(headingIndex + 1, end < 0 ? lines.length : end).join("\n").trim()];
  }));
}
