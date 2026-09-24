import { expect, test } from "@jest/globals";
import {
  expectedReadmeHeadings,
  readReadmeSections,
  requiredReadmeSections,
} from "../../../../../src/checks/general/E-1/E-1.1/read-readme-sections.mjs";

test("extracts the required README sections", () => {
  const sections = readReadmeSections("## Features\ncontent\n## Usage\nrun it");
  expect(requiredReadmeSections).toContain("Features");
  expect(sections.get("Features")).toBe("content");
  expect(sections.get("Usage")).toBe("run it");
  expect(sections.get("License")).toBe("");
});

test("uses profile headings in canonical order regardless of package declaration order", () => {
  expect(expectedReadmeHeadings()).toContain("Features");
  expect(expectedReadmeHeadings({ eliware: { apply: ["npm-published"] } })).not.toContain(
    "Configuration",
  );
  expect(expectedReadmeHeadings({ eliware: { apply: ["cli", "application"] } })).toEqual([
    "Table of Contents",
    "Features",
    "Requirements",
    "Setup",
    "Usage",
    "Development",
    "Testing",
    "Troubleshooting",
    "Security",
    "Configuration",
    "Operations",
    "Commands",
    "Exit codes",
    "Support",
    "License",
    "Links",
  ]);
  expect(
    expectedReadmeHeadings({
      eliware: { apply: ["npm-published", "documentation", "cli", "application"] },
    }),
  ).toEqual([
    "Table of Contents",
    "Features",
    "Requirements",
    "Setup",
    "Usage",
    "Development",
    "Testing",
    "Troubleshooting",
    "Security",
    "Configuration",
    "Operations",
    "Commands",
    "Exit codes",
    "Scope",
    "Authority",
    "Navigation",
    "Contribution",
    "Documentation validation",
    "Support",
    "License",
    "Links",
  ]);
  expect(
    expectedReadmeHeadings({ eliware: { apply: ["application", "discord", "mcp-server"] } }),
  ).toEqual([
    "Table of Contents",
    "Features",
    "Requirements",
    "Setup",
    "Usage",
    "Development",
    "Testing",
    "Troubleshooting",
    "Security",
    "Configuration",
    "Operations",
    "Commands",
    "Events",
    "Intents and permissions",
    "Tools",
    "Resources",
    "Prompts",
    "Transport",
    "Authentication",
    "Schemas",
    "Support",
    "License",
    "Links",
  ]);
});

test("orders every README profile extension canonically and merges repeated headings", () => {
  expect(
    expectedReadmeHeadings({
      eliware: {
        apply: [
          "private",
          "ghcr-published",
          "npm-published",
          "workspace",
          "infrastructure",
          "library",
          "web",
          "documentation",
          "mcp-server",
          "discord",
          "cli",
          "application",
        ],
      },
    }),
  ).toEqual([
    "Table of Contents",
    "Features",
    "Requirements",
    "Setup",
    "Usage",
    "Development",
    "Testing",
    "Troubleshooting",
    "Security",
    "Configuration",
    "Operations",
    "Commands",
    "Exit codes",
    "Events",
    "Intents and permissions",
    "Tools",
    "Resources",
    "Prompts",
    "Transport",
    "Authentication",
    "Schemas",
    "Routes",
    "Assets",
    "Development server",
    "Build",
    "Deployment",
    "API",
    "Packaging",
    "Examples",
    "Managed targets",
    "Desired state",
    "Validation",
    "Change boundaries",
    "Authority",
    "Runbooks",
    "Communication",
    "Recovery",
    "Scope",
    "Navigation",
    "Contribution",
    "Documentation validation",
    "Support",
    "License",
    "Links",
  ]);
});
