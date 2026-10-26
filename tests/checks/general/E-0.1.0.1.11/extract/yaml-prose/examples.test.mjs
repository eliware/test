import { expect, test } from "@jest/globals";
import { isYamlExamplePath } from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/yaml-prose/examples.mjs";

test("identifies example paths at any depth", () => {
  expect(isYamlExamplePath(["directives", "0", "examples"])).toBe(true);
  expect(isYamlExamplePath(["examples", "0", "description"])).toBe(true);
  expect(isYamlExamplePath(["directives", "0", "dos"])).toBe(false);
});
