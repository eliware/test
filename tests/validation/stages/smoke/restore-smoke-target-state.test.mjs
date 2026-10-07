import { expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { restoreSmokeTargetState } from "../../../../src/validation/stages/smoke/restore-smoke-target-state.mjs";

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

test("restores files, directories, symlinks, and absent paths", async () => {
  const fs = mockFs();
  await restoreSmokeTargetState(
    {
      storage: "backup",
      entries: [
        { path: "missing", type: "missing" },
        { path: "file", type: "file", data: Buffer.from("x"), mode: 420 },
        { path: "dir", type: "directory", backup: "backup/dir" },
        { path: "link", type: "symlink", target: "C:/target", linkType: "junction" },
      ],
    },
    fs,
  );
  expect(fs.writeFile).toHaveBeenCalledWith("file", Buffer.from("x"));
  expect(fs.cp).toHaveBeenCalledWith("backup/dir", "dir", {
    recursive: true,
    verbatimSymlinks: true,
  });
  expect(fs.symlink).toHaveBeenCalledWith("C:/target", "link", "junction");
  expect(fs.rm).toHaveBeenCalledWith("backup", { recursive: true, force: true });
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

test("unlinks a consumer replacement symlink without recursive removal", async () => {
  const fs = mockFs();
  fs.lstat.mockResolvedValue({ isSymbolicLink: () => true, isDirectory: () => false });
  await restoreSmokeTargetState(
    {
      storage: "backup",
      entries: [{ path: "captured-package", type: "missing" }],
    },
    fs,
  );
  expect(fs.unlink).toHaveBeenCalledWith("captured-package");
  expect(fs.rm).toHaveBeenCalledWith("backup", { recursive: true, force: true });
  expect(fs.rm).not.toHaveBeenCalledWith("captured-package", expect.anything());
});

test("skips absent captured paths during cleanup", async () => {
  const fs = mockFs();
  fs.lstat.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));
  await expect(
    restoreSmokeTargetState(
      { storage: "backup", entries: [{ path: "already-absent", type: "missing" }] },
      fs,
    ),
  ).resolves.toBeUndefined();
  expect(fs.rm).toHaveBeenCalledWith("backup", { recursive: true, force: true });
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

test("restores the replaced package directory and preserves unrelated consumer files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-smoke-restore-"));
  const packageDirectory = join(root, "node_modules", "@eliware", "test");
  const backup = join(root, "backup", "test");
  const unrelatedFile = join(root, "consumer-output.txt");
  await mkdir(packageDirectory, { recursive: true });
  await mkdir(backup, { recursive: true });
  await writeFile(join(packageDirectory, "candidate.txt"), "candidate");
  await writeFile(join(backup, "original.txt"), "original");
  await writeFile(unrelatedFile, "preserve");

  try {
    await restoreSmokeTargetState({
      storage: join(root, "backup"),
      entries: [{ path: packageDirectory, type: "directory", backup }],
    });
    await expect(readFile(join(packageDirectory, "original.txt"), "utf8")).resolves.toBe(
      "original",
    );
    await expect(readFile(join(packageDirectory, "candidate.txt"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(readFile(unrelatedFile, "utf8")).resolves.toBe("preserve");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
