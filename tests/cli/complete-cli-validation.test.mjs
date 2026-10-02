import { expect, jest, test } from "@jest/globals";
import { completeCliValidation } from "../../src/cli/complete-cli-validation.mjs";

test("returns validation result after successfully releasing the lock", async () => {
  const releaseLock = jest.fn();
  const reportError = jest.fn();

  await expect(completeCliValidation({ resultCode: 0, releaseLock, reportError })).resolves.toBe(0);

  expect(releaseLock).toHaveBeenCalledTimes(1);
  expect(reportError).not.toHaveBeenCalled();
});

test("maps lock release failures and preserves failed validation codes", async () => {
  const releaseError = new Error("lock cleanup failed");
  const releaseLock = jest.fn().mockRejectedValue(releaseError);
  const reportError = jest.fn(() => 18);

  await expect(completeCliValidation({ resultCode: 0, releaseLock, reportError })).resolves.toBe(
    18,
  );
  expect(reportError).toHaveBeenCalledWith(releaseError);

  await expect(completeCliValidation({ resultCode: 12, releaseLock, reportError })).resolves.toBe(
    12,
  );
});

test("preserves validation errors while reporting a lock release error", async () => {
  const validationError = new Error("validation failed");
  const releaseError = new Error("lock cleanup failed");
  const releaseLock = jest.fn().mockRejectedValue(releaseError);
  const reportError = jest.fn((error) => (error === validationError ? 12 : 18));

  await expect(completeCliValidation({ validationError, releaseLock, reportError })).resolves.toBe(
    12,
  );
  expect(reportError).toHaveBeenNthCalledWith(1, validationError);
  expect(reportError).toHaveBeenNthCalledWith(2, releaseError);
});

test("reports validation errors when lock release succeeds", async () => {
  const validationError = new Error("validation failed");
  const releaseLock = jest.fn();
  const reportError = jest.fn(() => 12);

  await expect(completeCliValidation({ validationError, releaseLock, reportError })).resolves.toBe(
    12,
  );
  expect(reportError).toHaveBeenCalledTimes(1);
  expect(reportError).toHaveBeenCalledWith(validationError);
});
