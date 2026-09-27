import { expect, test } from "@jest/globals";
import {
  expectedReadmeHeadings,
  readmeSectionsCacheKey,
  requiredReadmeSections,
} from "../../../../../src/checks/general/E-0.1/E-0.1.1/resolve-readme-headings.mjs";

test("builds profile headings in canonical order and merges repeated headings", () => {
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
    expectedReadmeHeadings({ eliware: { apply: ["application", "discord", "mcp-server"] } }),
  ).toEqual([
    "Table of Contents",
    ...requiredReadmeSections.slice(0, 8),
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
    ...requiredReadmeSections.slice(8),
  ]);
});

test("creates a stable cache key from applied profile declarations", () => {
  expect(readmeSectionsCacheKey()).toBe("readme:sections:[]");
  expect(readmeSectionsCacheKey({ eliware: { apply: ["cli", "application"] } })).toBe(
    'readme:sections:["cli","application"]',
  );
});
