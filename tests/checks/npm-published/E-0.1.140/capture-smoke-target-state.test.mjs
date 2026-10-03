import { expect, test } from "@jest/globals";
import { rm } from "node:fs/promises";
import { captureSmokeTargetState } from "../../../../src/checks/npm-published/E-0.1.140/capture-smoke-target-state.mjs";

function missingFs() {
  return {
    cp: async () => {},
    lstat: async () => {
      const error = new Error("missing");
      error.code = "ENOENT";
      throw error;
    },
    readFile: async () => Buffer.from(""),
    readlink: async () => "",
    rm: async () => {},
    stat: async () => ({ isDirectory: () => false }),
  };
}

test("captures file, directory, and missing target state", async () => {
  let count = 0;
  const fs = {
    ...missingFs(),
    lstat: async () => {
      count += 1;
      if (count === 1)
        return {
          isSymbolicLink: () => false,
          isDirectory: () => false,
          isFile: () => true,
          mode: 420,
        };
      if (count === 2)
        return { isSymbolicLink: () => false, isDirectory: () => true, isFile: () => false };
      throw Object.assign(new Error("missing"), { code: "ENOENT" });
    },
    cp: async () => {},
    readFile: async () => Buffer.from("preserved"),
  };
  const state = await captureSmokeTargetState("C:/consumer", "@eliware/test", [], fs);
  expect(state.entries[0]).toMatchObject({ type: "file", data: Buffer.from("preserved") });
  expect(state.entries[1].type).toBe("directory");
  expect(state.entries[2].type).toBe("missing");
  await rm(state.storage, { recursive: true, force: true });
  const defaults = await captureSmokeTargetState("C:/missing-consumer", "@eliware/test");
  await rm(defaults.storage, { recursive: true, force: true });
});

test("captures symlink targets and directory junction type", async () => {
  let count = 0;
  const fs = {
    ...missingFs(),
    lstat: async () => {
      count += 1;
      return count === 1
        ? { isSymbolicLink: () => true, isDirectory: () => false, isFile: () => false }
        : Promise.reject(Object.assign(new Error("missing"), { code: "ENOENT" }));
    },
    readlink: async () => "C:/checkout/@eliware/test",
    stat: async () => ({ isDirectory: () => true }),
  };
  const state = await captureSmokeTargetState("C:/consumer", "@eliware/test", [], fs);
  expect(state.entries[0]).toMatchObject({
    type: "symlink",
    target: "C:/checkout/@eliware/test",
    linkType: "junction",
  });
  await rm(state.storage, { recursive: true, force: true });
  const fileLinkFs = {
    ...missingFs(),
    lstat: async () => ({
      isSymbolicLink: () => true,
      isDirectory: () => false,
      isFile: () => false,
    }),
    readlink: async () => "C:/checkout/file",
  };
  const fileLink = await captureSmokeTargetState("C:/consumer", "@eliware/test", [], fileLinkFs);
  expect(fileLink.entries[0]).toMatchObject({ type: "symlink", linkType: "file" });
  await rm(fileLink.storage, { recursive: true, force: true });
});

test("removes backup storage and refuses unsupported state or filesystem errors", async () => {
  const unsupported = {
    ...missingFs(),
    lstat: async () => ({
      isSymbolicLink: () => false,
      isDirectory: () => false,
      isFile: () => false,
    }),
    rm: async () => {},
  };
  await expect(
    captureSmokeTargetState("C:/consumer", "@eliware/test", [], unsupported),
  ).rejects.toThrow("unsupported target path");
  const failed = {
    ...missingFs(),
    lstat: async () => {
      throw new Error("denied");
    },
  };
  await expect(captureSmokeTargetState("C:/consumer", "@eliware/test", [], failed)).rejects.toThrow(
    "denied",
  );
});
