import { expect, jest, test } from "@jest/globals";
import { prepareSmokeState } from "../../../../../src/validation/stages/smoke/prepare-smoke/state.mjs";

test("checks target identity, validates package parents, and captures recovery state", async () => {
  const order = [];
  const assertTargetIdentity = jest.fn(async () => order.push("identity"));
  const assertPackageParents = jest.fn(async () => order.push("parents"));
  const createDirectory = jest.fn(async () => order.push("directory"));
  const captureState = jest.fn(async () => {
    order.push("capture");
    return { storage: "backup-root" };
  });
  const write = jest.fn();

  await expect(
    prepareSmokeState({
      targetRoot: "consumer-root",
      packageJson: { name: "@eliware/example" },
      binNames: ["example"],
      assertTargetIdentity,
      assertPackageParents,
      captureState,
      backupDirectory: "backup-root",
      createDirectory,
      write,
      platform: "test-platform",
    }),
  ).resolves.toEqual({ storage: "backup-root" });
  expect(order).toEqual(["identity", "parents", "directory", "capture"]);
  expect(assertPackageParents).toHaveBeenCalledWith("consumer-root", "@eliware/example");
  expect(captureState).toHaveBeenCalledWith(
    "consumer-root",
    "@eliware/example",
    ["example"],
    undefined,
    "test-platform",
    "backup-root",
  );
  expect(write).toHaveBeenCalledWith("Target recovery snapshot: backup-root");
});

test("stops before creating a backup when target identity changes", async () => {
  const createDirectory = jest.fn();
  const captureState = jest.fn();
  const error = new Error("target changed");

  await expect(
    prepareSmokeState({
      targetRoot: "consumer-root",
      packageJson: { name: "@eliware/example" },
      binNames: [],
      assertTargetIdentity: async () => {
        throw error;
      },
      assertPackageParents: jest.fn(),
      captureState,
      backupDirectory: "backup-root",
      createDirectory,
      write: jest.fn(),
      platform: "test-platform",
    }),
  ).rejects.toBe(error);
  expect(createDirectory).not.toHaveBeenCalled();
  expect(captureState).not.toHaveBeenCalled();
});
