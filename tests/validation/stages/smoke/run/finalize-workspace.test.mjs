import { expect, jest, test } from "@jest/globals";
import finalizeNpmConsumerSmokeWorkspace from "../../../../../src/validation/stages/smoke/run/finalize-workspace.mjs";
test("formats the transaction outcome and finalizes workspace state", async () => {
  const finish = jest.fn(async ({ outcome }) => `${outcome} cleaned`);
  await expect(
    finalizeNpmConsumerSmokeWorkspace({
      packageJson: { name: "@eliware/example", version: "1.0.0" },
      context: { targetRoot: "consumer", assertTargetIdentity: jest.fn() },
      workspace: { tempRoot: "temporary", tempIdentity: "identity", state: "snapshot" },
      executeTransaction: async () => "digest",
      finish,
    }),
  ).resolves.toBe("Smoke passed: @eliware/example@1.0.0. SHA-256 digest. cleaned");
  expect(finish).toHaveBeenCalledWith(
    expect.objectContaining({ state: "snapshot", tempRoot: "temporary", tempIdentity: "identity" }),
  );
});
test("reports finalization failures while preserving the transaction result", async () => {
  await expect(
    finalizeNpmConsumerSmokeWorkspace({
      packageJson: { name: "@eliware/example", version: "1.0.0" },
      context: { targetRoot: "consumer" },
      workspace: { tempRoot: "temporary" },
      executeTransaction: async () => "digest",
      finish: async () => {
        throw new Error("restore failed");
      },
    }),
  ).resolves.toContain("Smoke finalization failed: restore failed.");
});
