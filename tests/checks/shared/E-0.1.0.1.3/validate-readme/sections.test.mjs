import { expect, test } from "@jest/globals";
import { validateReadmeSections } from "../../../../../src/checks/shared/E-0.1.0.1.3/validate-readme/sections.mjs";

const titleIndex = 2;
const tocIndex = 6;
const expected = ["Features", "License"];
const lines = [
  "brand",
  "",
  "## fixture",
  "",
  "description",
  "",
  "## Table of Contents",
  "- [Features](#features)",
  "## Features",
  "Content",
  "## License",
  "License text",
];

test("accepts each required section with content", () => {
  expect(validateReadmeSections(lines, expected, titleIndex, tocIndex).error).toBeNull();
});

test("reports missing, duplicate, and unlisted sections", () => {
  const result = validateReadmeSections(
    [...lines.slice(0, 8), "## Features", "Content", "## Other", "Content"],
    expected,
    titleIndex,
    tocIndex,
  );
  expect(result.error).toContain("every required section once");
});

test("reports sections without body content", () => {
  const result = validateReadmeSections(
    [...lines.slice(0, 8), "## Features", "### Nested", "## License", ""],
    expected,
    titleIndex,
    tocIndex,
  );
  expect(result.error).toContain("README.md section Features must contain content.");
});
