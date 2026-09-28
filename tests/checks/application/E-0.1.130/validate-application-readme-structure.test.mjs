import { expect, test } from "@jest/globals";
import { validateApplicationReadmeStructure } from "../../../../src/checks/application/E-0.1.130/validate-application-readme-structure.mjs";

const readme =
  "## Table of Contents\n[Configuration](#configuration) [Operations](#operations)\n## Configuration\nText\n## Operations\nText";

test("requires ordered application headings linked from the table of contents", () => {
  expect(validateApplicationReadmeStructure(readme)).toBeNull();
  expect(validateApplicationReadmeStructure("## Operations\n## Configuration")).toContain(
    "in that order",
  );
  expect(validateApplicationReadmeStructure("## Configuration\n## Operations")).toContain(
    "Table of Contents",
  );
});
