import { expect, jest, test } from "@jest/globals";
import { createJestCoverageDirectory } from "../../../../../src/validation/stages/jest/configuration/create-jest-coverage-directory.mjs";
import { rm } from "node:fs/promises";

test("creates unique writable run-scoped coverage directories", async () => {
  const first = await createJestCoverageDirectory();
  const second = await createJestCoverageDirectory();
  try {
    expect(first).not.toBe(second);
    expect(first).toMatch(/[\\/]eliware-test[\\/]coverage-/u);
    expect(second).toMatch(/[\\/]eliware-test[\\/]coverage-/u);
  } finally {
    await Promise.all([
      rm(first, { recursive: true, force: true }),
      rm(second, { recursive: true, force: true }),
    ]);
  }
});

test("reports a clear diagnostic when the system temp directory is unavailable", async () => {
  await expect(
    createJestCoverageDirectory({
      getTemporaryDirectory: () => "C:/restricted-temp",
      ensureDirectory: jest.fn().mockRejectedValue(new Error("permission denied")),
    }),
  ).rejects.toThrow(/system temporary directory.*eliware-test.*permission denied/u);
  await expect(
    createJestCoverageDirectory({
      getTemporaryDirectory: () => "C:/restricted-temp",
      ensureDirectory: jest.fn(),
      createTemporaryDirectory: jest.fn().mockRejectedValue("disk unavailable"),
    }),
  ).rejects.toThrow(/disk unavailable/u);
});
