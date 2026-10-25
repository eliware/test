import { expect, jest, test } from "@jest/globals";
import { attemptSmokeTargetRestoration } from "../../../../../src/validation/stages/smoke/restore/attempt-target-restoration.mjs";

test("reports missing or invalid snapshots as recovery failures", async () => {
  const restoreState = jest.fn();
  await expect(attemptSmokeTargetRestoration(undefined, jest.fn(), restoreState)).resolves.toEqual({
    restored: false,
    error: "Target recovery snapshot is unavailable.",
  });
  await expect(
    attemptSmokeTargetRestoration({ error: "capture failed" }, jest.fn(), restoreState),
  ).resolves.toEqual({ restored: false, error: "capture failed" });
  expect(restoreState).not.toHaveBeenCalled();
});

test("returns snapshot restoration errors", async () => {
  await expect(
    attemptSmokeTargetRestoration({}, jest.fn(), async () => {
      throw new Error("restore failed");
    }),
  ).resolves.toEqual({ restored: false, error: "restore failed" });
});
