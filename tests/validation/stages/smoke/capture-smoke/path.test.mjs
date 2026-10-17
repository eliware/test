import { expect, test } from "@jest/globals";
import { captureSmokePath } from "../../../../../src/validation/stages/smoke/capture-smoke/path.mjs";

function missingFs() {
  return {
    cp: async () => {},
    lstat: async () => {
      throw Object.assign(new Error("missing"), { code: "ENOENT" });
    },
    readFile: async () => Buffer.from(""),
  };
}

test("routes symlink capture to the focused symlink policy", async () => {
  const fs = {
    ...missingFs(),
    lstat: async () => ({ isSymbolicLink: () => true }),
    readlink: async () => "target",
    stat: async () => ({ isDirectory: () => true }),
  };
  await expect(captureSmokePath("link", "backup", fs, "win32")).resolves.toMatchObject({
    type: "symlink",
    target: "target",
    linkType: "junction",
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
