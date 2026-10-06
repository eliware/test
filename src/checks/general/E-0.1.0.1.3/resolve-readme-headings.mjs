const general = [
  "Features",
  "Requirements",
  "Setup",
  "Usage",
  "Development",
  "Testing",
  "Troubleshooting",
  "Security",
];
const profiles = [
  ["documentation", ["Scope", "Navigation", "Contribution", "Documentation validation"]],
  ["workspace", ["Runbooks", "Communication", "Recovery"]],
  ["library", ["API", "Packaging", "Examples"]],
  ["application", ["Configuration", "Operations"]],
  ["cli", ["Commands", "Exit codes"]],
  ["web", ["Configuration", "Routes", "Assets", "Development server", "Build", "Deployment"]],
  ["discord", ["Commands", "Events", "Intents and permissions", "Operations"]],
  [
    "mcp-server",
    ["Tools", "Resources", "Prompts", "Transport", "Authentication", "Schemas", "Operations"],
  ],
  [
    "infrastructure",
    ["Managed targets", "Configuration", "Desired state", "Validation", "Change boundaries"],
  ],
];
const profileOrder = [
  "general",
  "documentation",
  "workspace",
  "library",
  "application",
  "cli",
  "web",
  "discord",
  "mcp-server",
  "infrastructure",
  "npm-published",
  "ghcr-published",
  "private",
];

export function resolveReadmeHeadings(packageJson = {}) {
  const applied = new Set(packageJson?.eliware?.apply ?? []);
  const profileSections = profileOrder.flatMap((profile) => {
    if (!applied.has(profile)) return [];
    return profiles.find(([name]) => name === profile)?.[1] ?? [];
  });
  const sections = [...general, ...profileSections];
  const unique = sections.filter((name, index) => sections.indexOf(name) === index);
  return ["Table of Contents", ...unique, "Support", "License", "Links"];
}
