import { expect, jest, test } from "@jest/globals";
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
test("coordinates a snapshot of all requested target paths", async () => {
  const state = await captureSmokeTargetState(
    "C:/consumer",
    "@eliware/test",
    ["eliware-test"],
    missingFs(),
    process.platform,
    "C:/smoke/backup",
  );
  expect(state.entries).toHaveLength(8);
  expect(state.entries.every(({ type }) => type === "missing")).toBe(true);
  expect(state.storage).toBe("C:/smoke/backup");
  expect(state.targetRoot).toBe("C:/consumer");
  expect(state.packageName).toBe("@eliware/test");
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
test("cleans failed snapshots and returns the original filesystem error", async () => {
  const fs = {
    ...missingFs(),
    lstat: async () => {
      throw new Error("read denied");
    },
    rm: jest.fn(async () => {}),
  };
  await expect(
    captureSmokeTargetState(
      "C:/consumer",
      "@eliware/test",
      [],
      fs,
      process.platform,
      "C:/smoke/backup",
    ),
  ).rejects.toThrow("read denied");
  expect(fs.rm).toHaveBeenCalledWith("C:/smoke/backup", { recursive: true, force: true });
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
