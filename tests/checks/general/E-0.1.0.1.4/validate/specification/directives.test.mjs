import { beforeEach, expect, jest, test } from "@jest/globals";

const validateBundledAndConsumerSpecifications = jest.fn();
jest.unstable_mockModule(
  "../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/directives/composition.mjs",
  () => ({ validateBundledAndConsumerSpecifications }),
);
const { validateSpecificationDirectives } =
  await import("../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/directives.mjs");

beforeEach(() => {
  validateBundledAndConsumerSpecifications.mockReset().mockResolvedValue([]);
});

test("delegates repository context and dependencies to the composition helper", async () => {
  const packageJson = { eliware: { id: "E-0" } };
  const dependencies = { read: jest.fn() };

  await expect(validateSpecificationDirectives("repo", packageJson, dependencies)).resolves.toEqual(
    [],
  );
  expect(validateBundledAndConsumerSpecifications).toHaveBeenCalledWith(
    "repo",
    packageJson,
    dependencies,
  );
});

test("uses default package data and dependencies", async () => {
  await expect(validateSpecificationDirectives("repo")).resolves.toEqual([]);
  expect(validateBundledAndConsumerSpecifications).toHaveBeenCalledWith("repo", {}, {});
});

test("returns the composition result", async () => {
  validateBundledAndConsumerSpecifications.mockResolvedValue(["bundled error", "consumer error"]);

  await expect(validateSpecificationDirectives("repo")).resolves.toEqual([
    "bundled error",
    "consumer error",
  ]);
});
