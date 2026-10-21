import { expect, test } from "@jest/globals";
import { captureSmokePath } from "../../../../../src/validation/stages/smoke/capture-smoke/entry.mjs";

function missingFs() {
  return {
    lstat: async () => {
      throw Object.assign(new Error("missing"), { code: "ENOENT" });
    },
  };
}

test("routes symlink capture to the symlink policy", async () => {
  const fs = {
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

test("records a missing path", async () => {
  await expect(captureSmokePath("missing", "backup", missingFs(), "linux")).resolves.toEqual({
    path: "missing",
    type: "missing",
  });
});

test("dispatches file and directory paths to their handlers", async () => {
  const fs = {
    cp: async () => {},
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
});

test("rejects unsupported entries and preserves filesystem errors", async () => {
  const unsupported = {
    lstat: async () => ({
      isSymbolicLink: () => false,
      isDirectory: () => false,
      isFile: () => false,
    }),
  };
  await expect(captureSmokePath("socket", "backup", unsupported, "linux")).rejects.toThrow(
    "unsupported target path",
  );
  const failed = { lstat: async () => Promise.reject(new Error("denied")) };
  await expect(captureSmokePath("path", "backup", failed, "linux")).rejects.toThrow("denied");
});
