import { expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import { prepareSmokeWorkspace } from "../../../../../src/validation/stages/smoke/prepare-smoke/workspace.mjs";

test("creates pack and backup folders around the recovery snapshot", async () => {
  const order = [];
  const createTempWorkspace = jest.fn(async () => {
    order.push("temp");
    return { path: "smoke-root", identity: "temp-identity" };
  });
  const prepareState = jest.fn(async ({ backupDirectory }) => {
    order.push(`state:${backupDirectory}`);
    return { storage: "snapshot" };
  });
  const createDirectory = jest.fn(async (path) => order.push(`directory:${path}`));

  await expect(
    prepareSmokeWorkspace({
      root: "repo",
      inspectTempRoot: jest.fn(),
      createTempRoot: jest.fn(),
      removeEmptyTempRoot: jest.fn(),
      createTempWorkspace,
      prepareState,
      createDirectory,
      stateOptions: { targetRoot: "consumer" },
    }),
  ).resolves.toEqual({
    tempRoot: "smoke-root",
    tempIdentity: "temp-identity",
    packDirectory: join("smoke-root", "pack"),
    state: { storage: "snapshot" },
  });
  expect(order).toEqual([
    "temp",
    `state:${join("smoke-root", "backup")}`,
    `directory:${join("smoke-root", "pack")}`,
  ]);
  expect(prepareState).toHaveBeenCalledWith({
    targetRoot: "consumer",
    backupDirectory: join("smoke-root", "backup"),
    createDirectory,
  });
});

test("returns temp-root errors before preparing workspace state", async () => {
  const prepareState = jest.fn();
  const createTempWorkspace = jest.fn(async () => ({ error: "temporary path failed" }));

  await expect(
    prepareSmokeWorkspace({
      root: "repo",
      inspectTempRoot: jest.fn(),
      createTempRoot: jest.fn(),
      removeEmptyTempRoot: jest.fn(),
      createTempWorkspace,
      prepareState,
      createDirectory: jest.fn(),
      stateOptions: {},
    }),
  ).resolves.toEqual({ error: "temporary path failed" });
  expect(prepareState).not.toHaveBeenCalled();
});

test("returns workspace details when state preparation fails", async () => {
  const error = new Error("snapshot failed");
  const prepareState = jest.fn(async () => {
    throw error;
  });
  const createTempWorkspace = jest.fn(async () => ({
    path: "smoke-root",
    identity: "temp-identity",
  }));
  const createDirectory = jest.fn();

  await expect(
    prepareSmokeWorkspace({
      root: "repo",
      inspectTempRoot: jest.fn(),
      createTempRoot: jest.fn(),
      removeEmptyTempRoot: jest.fn(),
      createTempWorkspace,
      prepareState,
      createDirectory,
      stateOptions: {},
    }),
  ).resolves.toMatchObject({
    tempRoot: "smoke-root",
    tempIdentity: "temp-identity",
    error,
  });
  expect(createDirectory).not.toHaveBeenCalled();
});
