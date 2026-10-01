import { expect, test } from "@jest/globals";
import { selectJestCli } from "../../../../../src/checks/general/E-0.1/E-0.1.20/select-jest-cli.mjs";

test("prefers consumer Jest and falls back to shared Jest when needed", () => {
  expect(
    selectJestCli(
      () => "consumer/jest.js",
      () => "shared/jest.js",
    ),
  ).toBe("consumer/jest.js");
  expect(
    selectJestCli(
      () => undefined,
      () => "shared/jest.js",
    ),
  ).toBe("shared/jest.js");
});

test("preserves consumer resolution errors when the shared fallback is unavailable", () => {
  const consumerError = new Error("Consumer Jest missing");
  expect(() =>
    selectJestCli(
      () => {
        throw consumerError;
      },
      () => undefined,
    ),
  ).toThrow(consumerError);
});

test("reports when neither resolver provides an executable", () => {
  expect(() =>
    selectJestCli(
      () => undefined,
      () => undefined,
    ),
  ).toThrow("No Jest executable could be resolved.");
});
