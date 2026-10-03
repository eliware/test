import { beforeEach, expect, jest, test } from "@jest/globals";

const validateEliwarePackageMetadata = jest.fn();
const validatePackageIdentity = jest.fn();
const validatePackageMetadata = jest.fn();
const validatePackageRuntime = jest.fn();
const validatePublicationFiles = jest.fn();
const loadRepoMapRecord = jest.fn();
const validateRepoMapMetadata = jest.fn();
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/load-repo-map-record.mjs", () => ({
  loadRepoMapRecord,
}));
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/validate-repo-map-metadata.mjs",
  () => ({ validateRepoMapMetadata }),
);
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
const record = { id: "E-7", repository: "eliware/example" };
const validators = [
  validateRepoMapMetadata,
  validateEliwarePackageMetadata,
  validatePackageIdentity,
  validatePackageMetadata,
  validatePackageRuntime,
  validatePublicationFiles,
];

beforeEach(() => {
  jest.resetAllMocks();
  loadRepoMapRecord.mockReturnValue({ available: true, record, error: null });
  for (const validator of validators) validator.mockReturnValue(null);
});

test("validates map identity before package metadata and passes the root to publication checks", () => {
  const packageJson = {};
  expect(run({ root: "/repo", packageJson })).toEqual({
    ruleId: "E-0.1.19",
    status: "pass",
    message: "",
  });
  const invocationOrder = validators.map((validator) => validator.mock.invocationCallOrder[0]);
  expect(invocationOrder).toEqual([...invocationOrder].sort((left, right) => left - right));
  expect(loadRepoMapRecord).toHaveBeenCalledWith("/repo", packageJson);
  expect(validatePackageMetadata).toHaveBeenCalledWith(packageJson, record);
  expect(validatePublicationFiles).toHaveBeenCalledWith(packageJson, "/repo");
});

test("uses package metadata when the sibling repo map is unavailable", () => {
  loadRepoMapRecord.mockReturnValue({ available: false, record: null, error: null });
  expect(run({ root: "/repo", packageJson: {} }).status).toBe("pass");
  expect(validateRepoMapMetadata).not.toHaveBeenCalled();
  expect(validatePackageMetadata).toHaveBeenCalledWith({}, null);
});

test("reports repo-map failures while continuing package validation", () => {
  loadRepoMapRecord.mockReturnValue({ available: true, record: null, error: "map failed" });
  expect(run({ root: "/repo", packageJson: {} })).toMatchObject({
    status: "fail",
    message: "map failed",
  });
  expect(validatePackageIdentity).toHaveBeenCalled();
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
    message: "failure 1\nfailure 2\nfailure 3\nfailure 4\nfailure 5\nfailure 6",
  });
  expect(validators.every((validator) => validator.mock.calls.length === 1)).toBe(true);
});
