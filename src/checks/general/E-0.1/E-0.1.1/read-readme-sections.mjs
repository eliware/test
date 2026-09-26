export const requiredReadmeSections = [
  "Features",
  "Requirements",
  "Setup",
  "Usage",
  "Development",
  "Testing",
  "Troubleshooting",
  "Security",
  "Support",
  "License",
  "Links",
];

const profileSections = {
  application: ["Configuration", "Operations"],
  cli: ["Commands", "Exit codes"],
  discord: ["Commands", "Events", "Intents and permissions", "Operations"],
  "mcp-server": [
    "Tools",
    "Resources",
    "Prompts",
    "Transport",
    "Authentication",
    "Schemas",
    "Operations",
  ],
  web: ["Configuration", "Routes", "Assets", "Development server", "Build", "Deployment"],
  library: ["API", "Packaging", "Examples"],
  infrastructure: [
    "Managed targets",
    "Configuration",
    "Desired state",
    "Validation",
    "Change boundaries",
  ],
  workspace: ["Authority", "Runbooks", "Communication", "Recovery"],
  documentation: ["Scope", "Authority", "Navigation", "Contribution", "Documentation validation"],
};
const profileOrder = [
  "application",
  "cli",
  "discord",
  "mcp-server",
  "web",
  "library",
  "infrastructure",
  "workspace",
  "documentation",
];

export function expectedReadmeHeadings(packageJson = {}) {
  const applied = new Set(packageJson?.eliware?.apply ?? []);
  const extensions = profileOrder.flatMap((profile) =>
    applied.has(profile) ? profileSections[profile] : [],
  );
  const uniqueExtensions = extensions.filter(
    (section, index) => extensions.indexOf(section) === index,
  );
  return [
    "Table of Contents",
    ...requiredReadmeSections.slice(0, 8),
    ...uniqueExtensions,
    ...requiredReadmeSections.slice(8),
  ];
}

export function readReadmeSections(readme, packageJson = {}) {
  const lines = readme.split(/\r?\n/);
  return new Map(
    expectedReadmeHeadings(packageJson).map((section) => {
      const headingIndex = lines.findIndex((line) =>
        new RegExp(`^#{1,6}\\s+${section}\\b`, "i").test(line),
      );
      if (headingIndex < 0) return [section, ""];
      const end = lines.findIndex(
        (line, index) => index > headingIndex && /^#{1,6}\s+\S/.test(line),
      );
      return [
        section,
        lines
          .slice(headingIndex + 1, end < 0 ? lines.length : end)
          .join("\n")
          .trim(),
      ];
    }),
  );
}
