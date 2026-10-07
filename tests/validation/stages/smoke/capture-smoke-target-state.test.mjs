import { expect, test } from "@jest/globals";
import { rm } from "node:fs/promises";
import { captureSmokeTargetState } from "../../../../src/validation/stages/smoke/capture-smoke-target-state.mjs";

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
      if (count === 5)
        return { isSymbolicLink: () => false, isDirectory: () => true, isFile: () => false };
      throw Object.assign(new Error("missing"), { code: "ENOENT" });
    },
    cp: async () => {},
    readFile: async () => Buffer.from("preserved"),
  };
  const state = await captureSmokeTargetState("C:/consumer", "@eliware/test", ["eliware-test"], fs);
  expect(state.entries[0]).toMatchObject({ type: "file", data: Buffer.from("preserved") });
  expect(state.entries[1].type).toBe("missing");
  expect(state.entries[4].type).toBe("directory");
  expect(state.entries).toHaveLength(8);
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
    rm,
    lstat: async () => ({
      isSymbolicLink: () => true,
      isDirectory: () => false,
      isFile: () => false,
    }),
    readlink: async () => "C:/checkout/file",
  };
  const fileLink = await captureSmokeTargetState(
    "C:/consumer",
    "@eliware/test",
    [],
    fileLinkFs,
    "linux",
  );
  expect(fileLink.entries[0]).toMatchObject({ type: "symlink", linkType: "file" });
  await rm(fileLink.storage, { recursive: true, force: true });
  await expect(
    captureSmokeTargetState("C:/consumer", "@eliware/test", [], fileLinkFs, "win32"),
  ).rejects.toThrow("Cannot safely preserve a Windows file symlink");
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

test("reports backup location when failed snapshot cleanup also fails", async () => {
  const failed = {
    ...missingFs(),
    lstat: async () => ({
      isSymbolicLink: () => false,
      isDirectory: () => true,
      isFile: () => false,
    }),
    cp: async () => {
      throw new Error("copy denied");
    },
    rm: async () => {
      throw new Error("cleanup denied");
    },
  };

  let failure;
  try {
    await captureSmokeTargetState("C:/consumer", "@eliware/test", [], failed);
  } catch (error) {
    failure = error;
  }
  expect(failure.message).toMatch(
    /copy denied.*temporary backup may remain at (.+): cleanup denied/u,
  );
  const retained = failure.message.match(
    /temporary backup may remain at (.+): cleanup denied/u,
  )?.[1];
  expect(retained).toBeTruthy();
  await rm(retained, { recursive: true, force: true });
});
