import { expect, test } from "@jest/globals";
import { isYamlDirectiveField } from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/yaml-prose/directive-fields.mjs";

test("selects dos and donts only inside directives", () => {
  expect(isYamlDirectiveField("dos", ["directives", "0", "dos"])).toBe(true);
  expect(isYamlDirectiveField("donts", ["directives", "0", "donts"])).toBe(true);
  expect(isYamlDirectiveField("dos", ["workflow", "dos"])).toBe(false);
  expect(isYamlDirectiveField("examples", ["directives", "0", "examples"])).toBe(false);
});
