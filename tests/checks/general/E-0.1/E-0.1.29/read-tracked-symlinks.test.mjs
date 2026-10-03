import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { readTrackedSymlinks } from "../../../../../src/checks/general/E-0.1/E-0.1.29/read-tracked-symlinks.mjs";

const execFileAsync = promisify(execFile);

async function createRepository() {
  const root = await mkdtemp(join(tmpdir(), "eliware-tracked-links-"));
  await execFileAsync("git", ["init", "--quiet", root], { windowsHide: true });
  return root;
}

async function addSymlinkIndexEntry(root, path, targetText) {
  const target = join(root, "link-target-content");
  await writeFile(target, targetText);
  const { stdout: hash } = await execFileAsync("git", ["-C", root, "hash-object", "-w", target], {
    windowsHide: true,
  });
  await execFileAsync(
    "git",
    ["-C", root, "update-index", "--add", "--cacheinfo", `120000,${hash.trim()},${path}`],
    { windowsHide: true },
  );
}

test("reads tracked file and directory symlink entries from Git index mode", async () => {
  const root = await createRepository();
  await mkdir(join(root, "target-directory"));
  try {
    await addSymlinkIndexEntry(root, "file-link", "target-file");
    await addSymlinkIndexEntry(root, "directory-link", "target-directory");
    await expect(readTrackedSymlinks(root)).resolves.toEqual(["directory-link", "file-link"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("ignores regular tracked files and returns an empty list", async () => {
  const root = await createRepository();
  try {
    await writeFile(join(root, "regular-file"), "content");
    await execFileAsync("git", ["-C", root, "add", "regular-file"], { windowsHide: true });
    await expect(readTrackedSymlinks(root)).resolves.toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("returns unavailable when Git index inspection fails", async () => {
  await expect(
    readTrackedSymlinks("/missing", async () => Promise.reject(new Error("git"))),
  ).resolves.toBeNull();
  const root = await mkdtemp(join(tmpdir(), "eliware-no-index-"));
  try {
    await expect(readTrackedSymlinks(root)).resolves.toBeNull();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
