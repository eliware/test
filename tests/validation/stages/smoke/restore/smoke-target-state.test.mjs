import { expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const defaultFs = Object.fromEntries(
  ["cp", "mkdir", "rm", "symlink", "writeFile", "chmod", "lstat", "unlink"].map((name) => [
    name,
    jest.fn(),
  ]),
);

jest.unstable_mockModule("node:fs/promises", () => defaultFs);

const { restoreSmokeTargetState } =
  await import("../../../../../src/validation/stages/smoke/restore/smoke-target-state.mjs");

function mockFs() {
  const fs = Object.fromEntries(
    ["cp", "mkdir", "rm", "symlink", "writeFile", "chmod", "unlink"].map((name) => [
      name,
      jest.fn(),
    ]),
  );
  fs.lstat = jest.fn(async () => ({ isSymbolicLink: () => false, isDirectory: () => false }));
  return fs;
}

test("checks package parents before restoring captured paths", async () => {
  const fs = mockFs();
  fs.lstat.mockImplementation(async (path) => {
    if (path.startsWith("consumer"))
      return { isSymbolicLink: () => false, isDirectory: () => true };
    throw Object.assign(new Error("missing"), { code: "ENOENT" });
  });
  await restoreSmokeTargetState(
    {
      storage: "backup",
      targetRoot: "consumer",
      packageName: "@eliware/test",
      entries: [{ path: join("consumer", "node_modules", "@eliware", "test"), type: "missing" }],
    },
    fs,
  );
  expect(fs.lstat).toHaveBeenCalledWith(join("consumer", "node_modules"));
  expect(fs.rm).toHaveBeenCalledWith("backup", { recursive: true, force: true });
});

test("restores root manifests when package parents block package restoration", async () => {
  const fs = mockFs();
  fs.lstat.mockImplementation(async (path) => {
    if (path === join("consumer", "node_modules"))
      return { isSymbolicLink: () => true, isDirectory: () => false };
    if (path === join("consumer", "package.json"))
      return { isSymbolicLink: () => false, isDirectory: () => false };
    throw Object.assign(new Error("missing"), { code: "ENOENT" });
  });
  await expect(
    restoreSmokeTargetState(
      {
        storage: "backup",
        targetRoot: "consumer",
        packageName: "@eliware/test",
        entries: [
          { path: join("consumer", "package.json"), type: "file", data: "{}", mode: 420 },
          {
            path: join("consumer", "node_modules", "@eliware", "test"),
            type: "directory",
            backup: "backup/package",
          },
        ],
      },
      fs,
    ),
  ).rejects.toThrow("Cannot safely use a smoke package path through a link");
  expect(fs.writeFile).toHaveBeenCalledWith(join("consumer", "package.json"), "{}");
  expect(fs.cp).not.toHaveBeenCalled();
  expect(fs.rm).not.toHaveBeenCalledWith("backup", expect.anything());
});

test("retains backup files and reports restoration failures", async () => {
  const fs = mockFs();
  fs.chmod.mockRejectedValue(new Error("denied"));
  await expect(
    restoreSmokeTargetState(
      {
        storage: "backup",
        entries: [{ path: "file", type: "file", data: Buffer.from("x"), mode: 420 }],
      },
      fs,
    ),
  ).rejects.toThrow("Backups remain at backup");
  expect(fs.rm).not.toHaveBeenCalledWith("backup", expect.anything());
  await expect(restoreSmokeTargetState({ error: "capture failed" }, fs)).rejects.toThrow(
    "capture failed",
  );
});

test("continues restoring independent captured paths after one path fails", async () => {
  const fs = mockFs();
  fs.rm.mockImplementation(async (path) => {
    if (path === "package") throw new Error("package restore denied");
  });
  const state = {
    storage: "backup",
    entries: [
      { path: "manifest", type: "file", data: Buffer.from("{}"), mode: 420 },
      { path: "package", type: "directory", backup: "backup/package" },
    ],
  };
  await expect(restoreSmokeTargetState(state, fs)).rejects.toThrow("package restore denied");
  expect(fs.writeFile).toHaveBeenCalledWith("manifest", Buffer.from("{}"));
  expect(fs.rm).not.toHaveBeenCalledWith("backup", { recursive: true, force: true });
});

test("retains recovery data if Windows cannot recreate a captured file symlink", async () => {
  const fs = mockFs();
  fs.symlink.mockRejectedValue(new Error("privilege not held"));
  await expect(
    restoreSmokeTargetState(
      {
        storage: "backup",
        entries: [{ path: "shim", type: "symlink", target: "original", linkType: "file" }],
      },
      fs,
    ),
  ).rejects.toThrow("Backups remain at backup");
  expect(fs.symlink).toHaveBeenCalledWith("original", "shim", "file");
  expect(fs.rm).not.toHaveBeenCalledWith("backup", expect.anything());
});

test("retains recovery data when a captured path cannot be inspected", async () => {
  const fs = mockFs();
  fs.lstat.mockRejectedValue(new Error("permission denied"));
  await expect(
    restoreSmokeTargetState(
      { storage: "backup", entries: [{ path: "inaccessible", type: "missing" }] },
      fs,
    ),
  ).rejects.toThrow("inaccessible: permission denied");
  expect(fs.rm).not.toHaveBeenCalledWith("backup", { recursive: true, force: true });
});

test("uses mocked filesystem defaults when no operation set is supplied", async () => {
  defaultFs.lstat.mockResolvedValue({ isDirectory: () => false, isSymbolicLink: () => false });
  await expect(
    restoreSmokeTargetState({
      entries: [{ path: "file", type: "file", data: "content", mode: 420 }],
    }),
  ).resolves.toBeUndefined();
  expect(defaultFs.writeFile).toHaveBeenCalledWith("file", "content");
  expect(defaultFs.chmod).toHaveBeenCalledWith("file", 420);
});
