import { expect, test } from "@jest/globals";
import { captureSmokeSymlink } from "../../../../../src/validation/stages/smoke/capture-smoke/symlink.mjs";

test("captures a Windows junction and its target", async () => {
  const fs = {
    stat: async () => ({ isDirectory: () => true }),
    readlink: async () => "C:/checkout/target",
  };
  await expect(captureSmokeSymlink("link", fs, "win32")).resolves.toEqual({
    path: "link",
    type: "symlink",
    target: "C:/checkout/target",
    linkType: "junction",
  });
});

test("rejects Windows file symlinks and accepts them on other platforms", async () => {
  const fs = {
    stat: async () => ({ isDirectory: () => false }),
    readlink: async () => "target",
  };
  await expect(captureSmokeSymlink("link", fs, "win32")).rejects.toThrow(
    "Cannot safely preserve a Windows file symlink",
  );
  await expect(captureSmokeSymlink("link", fs, "linux")).resolves.toMatchObject({
    type: "symlink",
    linkType: "file",
  });
});
