import { expect, test } from "@jest/globals";
import { expectedDirectiveSchema } from "../../../../../../src/checks/general/E-0.1.0.1.4/validate/directive-schema.mjs";
import { validateBundledDirectiveSchema } from "../../../../../../src/checks/general/E-0.1.0.1.4/validate/bundled/directive-schema.mjs";

test("validates all bundled directive schema documents", () => {
  expect(validateBundledDirectiveSchema([expectedDirectiveSchema])).toEqual([]);
  expect(validateBundledDirectiveSchema([expectedDirectiveSchema, {}])).toEqual([
    "specs/directives-schema.yaml must define the document and directive schema.",
  ]);
});
