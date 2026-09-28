import { beforeEach, expect, jest, test } from "@jest/globals";

const validateEliwarePackageMetadata = jest.fn();
const validatePackageIdentity = jest.fn();
const validatePackageMetadata = jest.fn();
const validatePackageRuntime = jest.fn();
const validatePublicationFiles = jest.fn();
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/validate-eliware-package-metadata.mjs",
  () => ({ validateEliwarePackageMetadata }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/validate-package-identity.mjs",
  () => ({ validatePackageIdentity }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/validate-package-metadata.mjs",
  () => ({ validatePackageMetadata }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/validate-package-runtime.mjs",
  () => ({ validatePackageRuntime }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/validate-publication-files.mjs",
  () => ({ validatePublicationFiles }),
);

const { run } = await import("../../../../src/checks/general/E-0.1/E-0.1.19.mjs");
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
  expect(run({ root: "/repo", packageJson })).toEqual({
    ruleId: "E-0.1.19",
    status: "pass",
    message: "",
  });
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
])("reports a failure from %p without skipping later validators", (failingValidator, message) => {
  failingValidator.mockReturnValueOnce(message);
  expect(run({ packageJson: {} })).toEqual({ ruleId: "E-0.1.19", status: "fail", message });
  expect(validators.every((validator) => validator.mock.calls.length === 1)).toBe(true);
});

test("reports independent package validation failures together", () => {
  validators.forEach((validator, index) => validator.mockReturnValueOnce(`failure ${index + 1}`));

  expect(run({ packageJson: {} })).toMatchObject({
    status: "fail",
    message: "failure 1\nfailure 2\nfailure 3\nfailure 4\nfailure 5",
  });
  expect(validators.every((validator) => validator.mock.calls.length === 1)).toBe(true);
});
