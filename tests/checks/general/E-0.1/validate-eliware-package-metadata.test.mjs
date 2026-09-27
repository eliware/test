import { beforeEach, expect, jest, test } from "@jest/globals";

const validatePackagePublicationMetadata = jest.fn();
const validatePackageExemptions = jest.fn();
const validatePackageModuleType = jest.fn();
const validatePackageScripts = jest.fn();

jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/validate-package-publication-metadata.mjs",
  () => ({ validatePackagePublicationMetadata }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/validate-package-exemptions.mjs",
  () => ({ validatePackageExemptions }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/validate-package-module-type.mjs",
  () => ({ validatePackageModuleType }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/validate-package-scripts.mjs",
  () => ({ validatePackageScripts }),
);

const { validateEliwarePackageMetadata } = await import(
  "../../../../src/checks/general/E-0.1/validate-eliware-package-metadata.mjs"
);
const validators = [
  validatePackageModuleType,
  validatePackageScripts,
  validatePackagePublicationMetadata,
  validatePackageExemptions,
];

function resetValidators() {
  jest.resetAllMocks();
  for (const validator of validators) validator.mockReturnValue(null);
}

beforeEach(resetValidators);

test("coordinates package policies in order and passes exemptions to their validator", () => {
  const packageJson = { type: "module", scripts: { test: "npm test" }, eliware: { exempt: [] } };

  expect(validateEliwarePackageMetadata(packageJson)).toBeNull();
  const phases = validators.map((validator) => validator.mock.invocationCallOrder[0]);
  expect(phases).toEqual([...phases].sort((left, right) => left - right));
  expect(validatePackageExemptions).toHaveBeenCalledWith([]);
});

test("stops at the first package-policy failure", () => {
  for (const [index, validator] of validators.entries()) {
    resetValidators();
    validator.mockReturnValueOnce("package policy invalid");

    expect(validateEliwarePackageMetadata({})).toBe("package policy invalid");
    for (const laterValidator of validators.slice(index + 1)) {
      expect(laterValidator).not.toHaveBeenCalled();
    }
  }
});
