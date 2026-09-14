import { expect, test } from "@jest/globals";
import { readReadmeSections, requiredReadmeSections } from "../../../../../src/checks/general/E-1/E-1.1/read-readme-sections.mjs";

test("extracts the required README sections", () => {
  const sections = readReadmeSections("# Purpose\ncontent\n## Usage\nrun it");
  expect(requiredReadmeSections).toContain("Purpose");
  expect(sections.get("Purpose")).toBe("content");
  expect(sections.get("Usage")).toBe("run it");
  expect(sections.get("License")).toBe("");
});
