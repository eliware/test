import { expect, test } from "@jest/globals";
import { readReadmeSections } from "../../../../../src/checks/general/E-0.1/E-0.1.1/read-readme-sections.mjs";

test("extracts requested README sections and normalizes their content", () => {
  const sections = readReadmeSections(
    "## Features\nCONTENT\n### Detail\ninner\n## Usage\nRun it",
    ["Features", "Usage", "License"],
  );

  expect(sections.get("Features")).toBe("content");
  expect(sections.get("Usage")).toBe("run it");
  expect(sections.get("License")).toBe("");
});
