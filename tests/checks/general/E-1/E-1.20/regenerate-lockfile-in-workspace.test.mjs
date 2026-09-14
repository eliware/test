import { expect, test } from "@jest/globals";
import { regenerateLockfileInWorkspace } from "../../../../../src/checks/general/E-1/E-1.20/regenerate-lockfile-in-workspace.mjs";

test("writes the isolated package files and reads the regenerated lockfile", async () => {
  const files = new Map();
  const lockfile = { lockfileVersion: 3, packages: {} };
  await expect(regenerateLockfileInWorkspace({
    temporary: "C:\\temp-lock",
    packageJson: { name: "fixture" },
    currentLockfile: lockfile,
    write: async (path, value) => files.set(path, value),
    read: async (path) => files.get(path),
    getNpmCommand: () => ["npm", []],
    runCommand: async (command, args, cwd) => {
      expect(command).toBe("npm");
      expect(args).toContain("--package-lock-only");
      expect(cwd).toBe("C:\\temp-lock");
      files.set("C:\\temp-lock\\package-lock.json", JSON.stringify(lockfile));
      return { code: 0, stderr: "" };
    },
  })).resolves.toEqual(lockfile);
});

test("reports regeneration failure", async () => {
  await expect(regenerateLockfileInWorkspace({
    temporary: "C:\\temp-lock",
    packageJson: {},
    currentLockfile: {},
    write: async () => {},
    read: async () => "{}",
    getNpmCommand: () => ["npm", []],
    runCommand: async () => ({ code: 1, stderr: "offline" }),
  })).rejects.toThrow("offline");
});
