import { expect, test } from "@jest/globals";
import { hasProhibitedYamlCommandReferences } from "../../../../../../../src/checks/application/E-0.1.4.1.3/validate/test-tool-references/yaml/command-references.mjs";

test("checks YAML commands and ignores unrelated command text", () => {
  expect(hasProhibitedYamlCommandReferences("steps:\n  - run: vitest run")).toBe(true);
  expect(hasProhibitedYamlCommandReferences("steps:\n  - run: npm test")).toBe(false);
  expect(hasProhibitedYamlCommandReferences("steps:\n  - run: jest", true)).toBe(false);
});
