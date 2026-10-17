import { expect, jest, test } from "@jest/globals";

jest.unstable_mockModule("node:fs/promises", () => ({}));
const { restoreCapturedSmokePath } =
  await import("../../../../../src/validation/stages/smoke/restore/captured-smoke-path.mjs");

function mockFs() {
  return {
    cp: jest.fn(),
    mkdir: jest.fn(),
    rm: jest.fn(),
    symlink: jest.fn(),
    writeFile: jest.fn(),
    chmod: jest.fn(),
    lstat: jest.fn(async () => ({ isSymbolicLink: () => false, isDirectory: () => false })),
    unlink: jest.fn(),
  };
}

test("restores a file and its original mode", async () => {
  const fs = mockFs();
  const data = Buffer.from("content");
  await restoreCapturedSmokePath({ path: "nested/file", type: "file", data, mode: 420 }, fs);
  expect(fs.rm).toHaveBeenCalledWith("nested/file", { recursive: false, force: true });
  expect(fs.mkdir).toHaveBeenCalledWith("nested", { recursive: true });
  expect(fs.writeFile).toHaveBeenCalledWith("nested/file", data);
  expect(fs.chmod).toHaveBeenCalledWith("nested/file", 420);
});

test("restores a directory from its backup", async () => {
  const fs = mockFs();
  fs.lstat.mockResolvedValue({ isSymbolicLink: () => false, isDirectory: () => true });
  await restoreCapturedSmokePath({ path: "dir", type: "directory", backup: "backup/dir" }, fs);
  expect(fs.rm).toHaveBeenCalledWith("dir", { recursive: true, force: true });
  expect(fs.cp).toHaveBeenCalledWith("backup/dir", "dir", {
    recursive: true,
    verbatimSymlinks: true,
  });
});

test("restores a symlink with its original target and type", async () => {
  const fs = mockFs();
  await restoreCapturedSmokePath(
    { path: "link", type: "symlink", target: "target", linkType: "junction" },
    fs,
  );
  expect(fs.symlink).toHaveBeenCalledWith("target", "link", "junction");
});

test("removes a replacement symlink without recursive removal", async () => {
  const fs = mockFs();
  fs.lstat.mockResolvedValue({ isSymbolicLink: () => true, isDirectory: () => false });
  await restoreCapturedSmokePath({ path: "link", type: "missing" }, fs);
  expect(fs.unlink).toHaveBeenCalledWith("link");
  expect(fs.rm).not.toHaveBeenCalled();
  expect(fs.mkdir).not.toHaveBeenCalled();
});

test("keeps an absent captured path absent", async () => {
  const fs = mockFs();
  fs.lstat.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));
  await restoreCapturedSmokePath({ path: "missing", type: "missing" }, fs);
  expect(fs.rm).not.toHaveBeenCalled();
  expect(fs.mkdir).not.toHaveBeenCalled();
});

test("propagates errors when it cannot inspect the current path", async () => {
  const fs = mockFs();
  fs.lstat.mockRejectedValue(new Error("permission denied"));
  await expect(restoreCapturedSmokePath({ path: "locked", type: "missing" }, fs)).rejects.toThrow(
    "permission denied",
  );
});
