import { expect, test } from "@jest/globals";
import { resolveReadmeHeadings } from "../../../../src/checks/general/E-0.1.0.1.3/resolve-readme-headings.mjs";

test("returns general sections when profile metadata is absent", () => {
  expect(resolveReadmeHeadings()[1]).toBe("Features");
  expect(resolveReadmeHeadings().at(-3)).toBe("Support");
});

test("adds selected profile sections in canonical order without duplicates", () => {
  const headings = resolveReadmeHeadings({ eliware: { apply: ["cli", "application", "general"] } });
  expect(headings).toEqual([
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
});
