import { expect, test } from "@jest/globals";
import { captureSmokePath } from "../../../../../src/validation/stages/smoke/capture-smoke/path.mjs";

function missingFs() {
  return {
    cp: async () => {},
    lstat: async () => {
      throw Object.assign(new Error("missing"), { code: "ENOENT" });
    },
    readFile: async () => Buffer.from(""),
    readlink: async () => "",
    stat: async () => ({ isDirectory: () => false }),
  };
}

test("captures symbolic links and identifies Windows junctions", async () => {
  const fs = {
    ...missingFs(),
    lstat: async () => ({ isSymbolicLink: () => true }),
    readlink: async () => "C:/checkout/@eliware/test",
    stat: async () => ({ isDirectory: () => true }),
  };
  await expect(captureSmokePath("link", "backup", fs, "win32")).resolves.toMatchObject({
    type: "symlink",
    target: "C:/checkout/@eliware/test",
    linkType: "junction",
  });
});

test("rejects file symlinks on Windows and accepts them on other platforms", async () => {
  const fs = {
    ...missingFs(),
    lstat: async () => ({ isSymbolicLink: () => true }),
    readlink: async () => "target",
  };
  await expect(captureSmokePath("link", "backup", fs, "win32")).rejects.toThrow(
    "Cannot safely preserve a Windows file symlink",
  );
  await expect(captureSmokePath("link", "backup", fs, "linux")).resolves.toMatchObject({
    type: "symlink",
    linkType: "file",
  });
});

test("captures files, directories, and missing paths", async () => {
  const fs = {
    ...missingFs(),
    lstat: async (path) => ({
      isSymbolicLink: () => false,
      isDirectory: () => path === "directory",
      isFile: () => path === "file",
      mode: 420,
    }),
    readFile: async () => Buffer.from("data"),
  };
  await expect(captureSmokePath("file", "backup", fs, "linux")).resolves.toMatchObject({
    type: "file",
    data: Buffer.from("data"),
  });
  await expect(captureSmokePath("directory", "backup", fs, "linux")).resolves.toMatchObject({
    type: "directory",
  });
  await expect(captureSmokePath("missing", "backup", missingFs(), "linux")).resolves.toMatchObject({
    type: "missing",
  });
});

test("rejects unsupported entries and preserves filesystem errors", async () => {
  const unsupported = {
    ...missingFs(),
    lstat: async () => ({
      isSymbolicLink: () => false,
      isDirectory: () => false,
      isFile: () => false,
    }),
  };
  await expect(captureSmokePath("socket", "backup", unsupported, "linux")).rejects.toThrow(
    "unsupported target path",
  );
  const failed = { ...missingFs(), lstat: async () => Promise.reject(new Error("denied")) };
  await expect(captureSmokePath("path", "backup", failed, "linux")).rejects.toThrow("denied");
});
