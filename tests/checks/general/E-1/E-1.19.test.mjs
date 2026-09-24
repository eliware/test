import { beforeEach, expect, jest, test } from "@jest/globals";

const validateEliwarePackageMetadata = jest.fn();
const validatePackageIdentity = jest.fn();
const validatePackageMetadata = jest.fn();
const validatePackageRuntime = jest.fn();
const validatePublicationFiles = jest.fn();
jest.unstable_mockModule("../../../../src/checks/general/E-1/validate-eliware-package-metadata.mjs", () => ({ validateEliwarePackageMetadata }));
jest.unstable_mockModule("../../../../src/checks/general/E-1/validate-package-identity.mjs", () => ({ validatePackageIdentity }));
jest.unstable_mockModule("../../../../src/checks/general/E-1/validate-package-metadata.mjs", () => ({ validatePackageMetadata }));
jest.unstable_mockModule("../../../../src/checks/general/E-1/validate-package-runtime.mjs", () => ({ validatePackageRuntime }));
jest.unstable_mockModule("../../../../src/checks/general/E-1/validate-publication-files.mjs", () => ({ validatePublicationFiles }));

const { run } = await import("../../../../src/checks/general/E-1/E-1.19.mjs");
const validators = [
  validateEliwarePackageMetadata,
  validatePackageIdentity,
  validatePackageMetadata,
  validatePackageRuntime,
  validatePublicationFiles,
];

beforeEach(() => {
  jest.resetAllMocks();
  for (const validator of validators) validator.mockReturnValue(null);
});

test("runs package validators in order and passes the root to publication validation", () => {
  const packageJson = {};
  expect(run({ root: "/repo", packageJson })).toEqual({ ruleId: "E-1.19", status: "pass", message: "" });
  const invocationOrder = validators.map((validator) => validator.mock.invocationCallOrder[0]);
  expect(invocationOrder).toEqual([...invocationOrder].sort((left, right) => left - right));
  expect(validatePublicationFiles).toHaveBeenCalledWith(packageJson, "/repo");
});

test.each([
  [validateEliwarePackageMetadata, "Eliware metadata invalid"],
  [validatePackageIdentity, "package identity invalid"],
  [validatePackageMetadata, "package metadata invalid"],
  [validatePackageRuntime, "runtime invalid"],
  [validatePublicationFiles, "publication files invalid"],
])("maps the first failure from %p to the rule result", (failingValidator, message) => {
  failingValidator.mockReturnValueOnce(message);
  expect(run({ packageJson: {} })).toEqual({ ruleId: "E-1.19", status: "fail", message });
  const laterValidators = validators.slice(validators.indexOf(failingValidator) + 1);
  expect(laterValidators.every((validator) => !validator.mock.calls.length)).toBe(true);
});
