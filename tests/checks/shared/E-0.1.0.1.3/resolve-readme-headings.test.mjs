import { expect, test } from "@jest/globals";
import { resolveReadmeHeadings } from "../../../../src/checks/shared/E-0.1.0.1.3/resolve-readme-headings.mjs";

test("returns general sections when profile metadata is absent", () => {
  expect(resolveReadmeHeadings()[1]).toBe("Features");
  expect(resolveReadmeHeadings().slice(-3)).toEqual(["Support", "Links", "License"]);
});

test("adds selected profile sections in canonical document order without duplicates", () => {
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
    "Links",
    "License",
  ]);
});

test("keeps shared headings at their first profile position for Discord", () => {
  const headings = resolveReadmeHeadings({
    eliware: { apply: ["general", "application", "cli", "discord"] },
  });
  expect(headings).toContain("Operations");
  expect(headings.filter((heading) => heading === "Operations")).toHaveLength(1);
  expect(headings.filter((heading) => heading === "Commands")).toHaveLength(1);
  expect(headings.indexOf("Operations")).toBeLessThan(headings.indexOf("Commands"));
  expect(headings.indexOf("Commands")).toBeLessThan(headings.indexOf("Events"));
  expect(headings.indexOf("Events")).toBeLessThan(headings.indexOf("Intents and permissions"));
});

test("adds a shared heading when only a later listed profile requires it", () => {
  const headings = resolveReadmeHeadings({
    eliware: { apply: ["general", "application", "discord"] },
  });
  expect(headings.indexOf("Operations")).toBeLessThan(headings.indexOf("Commands"));
  expect(headings.indexOf("Commands")).toBeLessThan(headings.indexOf("Events"));
  expect(headings.indexOf("Events")).toBeLessThan(headings.indexOf("Intents and permissions"));
});

test("adds Documentation headings after Security for documentation repositories", () => {
  const headings = resolveReadmeHeadings({
    eliware: { apply: ["general", "documentation", "private"] },
  });
  expect(headings.slice(headings.indexOf("Security") + 1, -3)).toEqual([
    "Scope",
    "Navigation",
    "Contribution",
    "Documentation validation",
  ]);
});
