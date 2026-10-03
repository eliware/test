import { expect, jest, test } from "@jest/globals";
import { restoreSmokeTargetState } from "../../../../src/checks/npm-published/E-0.1.140/restore-smoke-target-state.mjs";

function mockFs() {
  return Object.fromEntries(
    ["cp", "mkdir", "rm", "symlink", "writeFile", "chmod"].map((name) => [name, jest.fn()]),
  );
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
