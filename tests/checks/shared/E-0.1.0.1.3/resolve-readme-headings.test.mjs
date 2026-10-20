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

test.each([
  ["CLI and Discord", ["general", "application", "cli", "discord"]],
  ["Discord", ["general", "application", "discord"]],
])("keeps shared headings in order for %s profiles", (_name, apply) => {
  const headings = resolveReadmeHeadings({ eliware: { apply } });
  expect(headings.indexOf("Operations")).toBeLessThan(headings.indexOf("Commands"));
  expect(headings.indexOf("Commands")).toBeLessThan(headings.indexOf("Events"));
  expect(headings.indexOf("Events")).toBeLessThan(headings.indexOf("Intents and permissions"));
});

test("includes each shared heading once when multiple profiles require it", () => {
  const headings = resolveReadmeHeadings({
    eliware: { apply: ["general", "application", "cli", "discord"] },
  });
  expect(headings.filter((heading) => heading === "Operations")).toHaveLength(1);
  expect(headings.filter((heading) => heading === "Commands")).toHaveLength(1);
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
