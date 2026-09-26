import { expect, test } from "@jest/globals";
import { findMissingReadmeSections } from "../../../../../src/checks/general/E-0.1/E-0.1.1/find-missing-readme-sections.mjs";

test("reports absent and empty required README sections but excludes the table of contents", () => {
  const sections = new Map([
    ["Features", "feature details"],
    ["Requirements", ""],
    ["Setup", "setup details"],
  ]);
  expect(findMissingReadmeSections(sections)).toEqual([
    "Requirements",
    "Usage",
    "Development",
    "Testing",
    "Troubleshooting",
    "Security",
    "Support",
    "License",
    "Links",
  ]);
});

test("includes required profile sections from package metadata", () => {
  expect(
    findMissingReadmeSections(new Map(), { eliware: { apply: ["cli"] } }),
  ).toContain("Commands");
});
