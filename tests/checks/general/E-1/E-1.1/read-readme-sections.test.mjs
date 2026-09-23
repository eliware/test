import { expect, test } from "@jest/globals";
import { expectedReadmeHeadings, readReadmeSections, requiredReadmeSections } from "../../../../../src/checks/general/E-1/E-1.1/read-readme-sections.mjs";

test("extracts the required README sections", () => {
  const sections = readReadmeSections("## Features\ncontent\n## Usage\nrun it");
  expect(requiredReadmeSections).toContain("Features");
  expect(sections.get("Features")).toBe("content");
  expect(sections.get("Usage")).toBe("run it");
  expect(sections.get("License")).toBe("");
});

test("uses profile headings in canonical order regardless of package declaration order", () => {
  expect(expectedReadmeHeadings()).toContain("Features");
  expect(expectedReadmeHeadings({ eliware: { apply: ["npm-published"] } })).not.toContain("Configuration");
  expect(expectedReadmeHeadings({ eliware: { apply: ["cli", "application"] } })).toEqual([
    "Table of Contents", "Features", "Requirements", "Setup", "Usage", "Development", "Testing",
    "Troubleshooting", "Security", "Configuration", "Operations", "Commands", "Exit codes",
    "Support", "License", "Links",
  ]);
});
