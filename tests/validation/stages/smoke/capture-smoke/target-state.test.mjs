import { expect, test } from "@jest/globals";
import { captureSmokeTargetState } from "../../../../../src/validation/stages/smoke/capture-smoke/target-state.mjs";
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
  const state = await captureSmokeTargetState(
    "C:/consumer",
    "@eliware/test",
    ["eliware-test"],
    fs,
    process.platform,
    "C:/smoke/backup",
  );
  expect(state.entries[0]).toMatchObject({ type: "file", data: Buffer.from("preserved") });
  expect(state.entries[1].type).toBe("missing");
  expect(state.entries[4].type).toBe("directory");
  expect(state.entries).toHaveLength(8);
  expect(state.storage).toBe("C:/smoke/backup");
});
test("uses default file system dependencies when a local storage path is supplied", async () => {
  await expect(
    captureSmokeTargetState(
      "C:/no-such-consumer",
      "@eliware/test",
      undefined,
      undefined,
      undefined,
      "C:/smoke/backup",
    ),
  ).resolves.toMatchObject({ storage: "C:/smoke/backup", entries: expect.any(Array) });
});
test("requires backup storage inside the smoke workspace", async () => {
  await expect(
    captureSmokeTargetState("C:/consumer", "@eliware/test", [], missingFs()),
  ).rejects.toThrow("Smoke state storage must be inside the smoke workspace.");
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
    captureSmokeTargetState(
      "C:/consumer",
      "@eliware/test",
      [],
      unsupported,
      process.platform,
      "C:/smoke/backup",
    ),
  ).rejects.toThrow("unsupported target path");
  const failed = {
    ...missingFs(),
    lstat: async () => {
      throw new Error("denied");
    },
  };
  await expect(
    captureSmokeTargetState(
      "C:/consumer",
      "@eliware/test",
      [],
      failed,
      process.platform,
      "C:/smoke/backup",
    ),
  ).rejects.toThrow("denied");
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
    await captureSmokeTargetState(
      "C:/consumer",
      "@eliware/test",
      [],
      failed,
      process.platform,
      "C:/smoke/backup",
    );
  } catch (error) {
    failure = error;
  }
  expect(failure.message).toMatch(
    /copy denied.*Temporary backup may remain at (.+): cleanup denied/u,
  );
  expect(failure.message).toContain("C:/smoke/backup");
});
