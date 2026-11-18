import { expect, test } from "@jest/globals";
import isYamlExamplePath from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/yaml-prose/examples.mjs";
test("identifies only top-level example paths", () => {
  expect(isYamlExamplePath(["directives", "0", "examples"])).toBe(false);
  expect(isYamlExamplePath(["examples", "0", "description"])).toBe(true);
  expect(isYamlExamplePath(["directives", "0", "dos"])).toBe(false);
});
