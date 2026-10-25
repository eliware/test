import { expect, test } from "@jest/globals";
import { inspectSmokeTargetIdentity } from "../../../../../src/validation/stages/smoke/resolve-smoke-target/identity.mjs";

test("requires an existing directory", async () => {
  await expect(
    inspectSmokeTargetIdentity("/consumer", async () => {
      throw new Error("missing");
    }),
  ).resolves.toEqual({ error: "Smoke target must resolve to an existing directory." });
  await expect(
    inspectSmokeTargetIdentity("/consumer", async () => ({ isDirectory: () => false })),
  ).resolves.toEqual({ error: "Smoke target must resolve to an existing directory." });
});
