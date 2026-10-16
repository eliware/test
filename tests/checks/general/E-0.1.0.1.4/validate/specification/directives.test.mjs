import { beforeEach, expect, jest, test } from "@jest/globals";

const validateBundledSpecifications = jest.fn();
const validateConsumerSpecifications = jest.fn();
jest.unstable_mockModule(
  "../../../../../../src/checks/general/E-0.1.0.1.4/validate/bundled-specifications.mjs",
  () => ({ validateBundledSpecifications }),
);
jest.unstable_mockModule(
  "../../../../../../src/checks/general/E-0.1.0.1.4/validate/consumer-specifications.mjs",
  () => ({ validateConsumerSpecifications }),
);
const { validateSpecificationDirectives } =
  await import("../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/directives.mjs");

beforeEach(() => {
  validateBundledSpecifications.mockReset().mockResolvedValue([]);
  validateConsumerSpecifications.mockReset().mockResolvedValue([]);
});

test("validates bundled and consumer directives", async () => {
  const dependencies = { read: jest.fn() };
  await expect(
    validateSpecificationDirectives("repo", { eliware: { id: "E-0" } }, dependencies),
  ).resolves.toEqual([]);
  expect(validateBundledSpecifications).toHaveBeenCalledWith(dependencies);
  expect(validateConsumerSpecifications).toHaveBeenCalledWith("repo", "E-0", dependencies);
});

test("uses default package data and dependencies", async () => {
  await expect(validateSpecificationDirectives("repo")).resolves.toEqual([]);
  expect(validateConsumerSpecifications).toHaveBeenCalledWith("repo", undefined, {});
});

test("returns all bundled and consumer validation errors", async () => {
  validateBundledSpecifications.mockResolvedValue(["bundled schema error"]);
  validateConsumerSpecifications.mockResolvedValue(["consumer document error"]);
  await expect(
    validateSpecificationDirectives("repo", { eliware: { id: "E-3" } }),
  ).resolves.toEqual(["bundled schema error", "consumer document error"]);
});
