import { beforeEach, expect, jest, test } from "@jest/globals";
const validateBundledSpecifications = jest.fn();
const validateConsumerSpecifications = jest.fn();
jest.unstable_mockModule(
  "../../../../../../../src/checks/general/E-0.1.0.1.4/validate/bundled-specifications.mjs",
  () => ({
    validateBundledSpecifications,
    default: validateBundledSpecifications,
  }),
);
jest.unstable_mockModule(
  "../../../../../../../src/checks/general/E-0.1.0.1.4/validate/consumer-specifications.mjs",
  () => ({
    validateConsumerSpecifications,
    default: validateConsumerSpecifications,
  }),
);
const validateBundledAndConsumerSpecifications = (
  await import("../../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/directives/composition.mjs")
).default;
beforeEach(() => {
  validateBundledSpecifications.mockReset().mockResolvedValue([]);
  validateConsumerSpecifications.mockReset().mockResolvedValue([]);
});
test("validates bundled and consumer specifications in sequence", async () => {
  const dependencies = {
    read: jest.fn(),
  };
  validateBundledSpecifications.mockResolvedValue(["bundled error"]);
  validateConsumerSpecifications.mockResolvedValue(["consumer error"]);
  await expect(
    validateBundledAndConsumerSpecifications(
      "repo",
      {
        eliware: {
          id: "E-2",
        },
      },
      dependencies,
    ),
  ).resolves.toEqual(["bundled error", "consumer error"]);
  expect(validateBundledSpecifications).toHaveBeenCalledWith(dependencies);
  expect(validateConsumerSpecifications).toHaveBeenCalledWith("repo", "E-2", dependencies);
});
test("supports package data without an Eliware id", async () => {
  await expect(validateBundledAndConsumerSpecifications("repo", {}, {})).resolves.toEqual([]);
  expect(validateConsumerSpecifications).toHaveBeenCalledWith("repo", undefined, {});
});
