import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { readIgnoredTrackedPaths } from "../../../../../src/checks/general/E-0.1/E-0.1.22/read-ignored-tracked-paths.mjs";

const execFileAsync = promisify(execFile);

test("finds staged files that match Git ignore rules", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-ignored-index-"));
  try {
    await execFileAsync("git", ["init", "--quiet", root], { windowsHide: true });
    await writeFile(join(root, ".gitignore"), ".env*\n");
    await writeFile(join(root, ".env.local"), "local state\n");
    await execFileAsync("git", ["-C", root, "add", ".gitignore"], { windowsHide: true });
    await execFileAsync("git", ["-C", root, "add", "-f", ".env.local"], { windowsHide: true });

    await expect(readIgnoredTrackedPaths(root)).resolves.toEqual([".env.local"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("returns unavailable when the repository index cannot be read", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-ignored-index-missing-"));
  try {
    await expect(readIgnoredTrackedPaths(root)).resolves.toBeNull();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
