import { expect, jest, test } from "@jest/globals";
import { attemptSmokeTargetRestoration } from "../../../../../src/validation/stages/smoke/restore/attempt-target-restoration.mjs";

test("verifies target identity and restores a valid snapshot", async () => {
  const state = { snapshot: true };
  const assertTargetIdentity = jest.fn();
  const restoreState = jest.fn();
  await expect(
    attemptSmokeTargetRestoration(state, assertTargetIdentity, restoreState),
  ).resolves.toEqual({ restored: true });
  expect(assertTargetIdentity).toHaveBeenCalledTimes(1);
  expect(restoreState).toHaveBeenCalledWith(state);
});

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

test("returns target identity errors without restoring", async () => {
  const restoreState = jest.fn();
  await expect(
    attemptSmokeTargetRestoration(
      {},
      async () => {
        throw new Error("identity changed");
      },
      restoreState,
    ),
  ).resolves.toEqual({ restored: false, error: "identity changed" });
  expect(restoreState).not.toHaveBeenCalled();
});

test("returns snapshot restoration errors", async () => {
  await expect(
    attemptSmokeTargetRestoration({}, jest.fn(), async () => {
      throw new Error("restore failed");
    }),
  ).resolves.toEqual({ restored: false, error: "restore failed" });
});
