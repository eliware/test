import { expect, jest, test } from "@jest/globals";
import { formatSmokeOutcome } from "../../../../../src/validation/stages/smoke/run/format-smoke-outcome.mjs";

const packageJson = { name: "@eliware/example", version: "1.2.3" };

test("formats a successful transaction result", async () => {
  await expect(formatSmokeOutcome(packageJson, async () => "digest")).resolves.toBe(
    "Smoke passed: @eliware/example@1.2.3. SHA-256 digest.",
  );
});

test("formats a transaction failure", async () => {
  const transaction = jest.fn().mockRejectedValue(new Error("install failed"));

  await expect(formatSmokeOutcome(packageJson, transaction)).resolves.toBe(
    "Tarball consumer smoke failed: install failed",
  );
  expect(transaction).toHaveBeenCalledTimes(1);
});
