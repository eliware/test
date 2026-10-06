import { expect, test } from "@jest/globals";
import {
  canonicalPrettierConfiguration,
  validatePrettierConfiguration,
} from "../../../../src/checks/general/E-0.1.0.1.5/validate-prettier-configuration.mjs";

test("accepts the exact canonical configuration", () => {
  expect(
    validatePrettierConfiguration({ prettier: { ...canonicalPrettierConfiguration } }),
  ).toEqual([]);
});

test("rejects missing, changed, and extra formatter settings", () => {
  expect(validatePrettierConfiguration({})).toHaveLength(1);
  expect(
    validatePrettierConfiguration({ prettier: { ...canonicalPrettierConfiguration, semi: false } }),
  ).toHaveLength(1);
  expect(
    validatePrettierConfiguration({ prettier: { ...canonicalPrettierConfiguration, extra: true } }),
  ).toHaveLength(1);
});
