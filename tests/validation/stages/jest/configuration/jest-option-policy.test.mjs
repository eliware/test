import { expect, test } from "@jest/globals";
import { validateJestOptionPolicy } from "../../../../../src/validation/stages/jest/configuration/jest-option-policy.mjs";

test("allows Jest options outside the wrapper-owned policy", () => {
  expect(() => validateJestOptionPolicy(["--watch", "--verbose"])).not.toThrow();
  expect(() => validateJestOptionPolicy([])).not.toThrow();
});

test.each(["--coverage=false", "--no-runInBand", "-c=jest.config.mjs"])(
  "rejects wrapper-owned Jest option %s",
  (option) => {
    expect(() => validateJestOptionPolicy([option])).toThrow("controlled by eliware-test");
  },
);
