import { afterEach, expect, test } from "@jest/globals";
import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prepareConsumerCoverageDirectory } from "../../../../../src/validation/stages/jest/configuration/prepare-consumer-coverage-directory.mjs";

const roots = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function createRoot() {
  const root = await mkdtemp(join(tmpdir(), "eliware-coverage-root-"));
  roots.push(root);
  return root;
}

test("creates the consumer coverage directory when it does not exist", async () => {
  const root = await createRoot();
  const directory = await prepareConsumerCoverageDirectory(root);
  expect(directory).toBe(join(root, "coverage"));
  await expect(lstat(directory)).resolves.toMatchObject({});
});

test("removes old files and nested directories from consumer coverage", async () => {
  const root = await createRoot();
  const directory = join(root, "coverage");
  await mkdir(join(directory, "old"), { recursive: true });
  await writeFile(join(directory, "old", "report.json"), "old");

  await prepareConsumerCoverageDirectory(root);

  await expect(readFile(join(directory, "old", "report.json"), "utf8")).rejects.toMatchObject({
    code: "ENOENT",
  });
});

test("rejects a coverage symbolic link", async () => {
  const root = await createRoot();
  const target = join(root, "target");
  await mkdir(target);
  await symlink(target, join(root, "coverage"), "junction");

  await expect(prepareConsumerCoverageDirectory(root)).rejects.toThrow(
    "coverage must not be a symbolic link.",
  );
  await expect(lstat(target)).resolves.toMatchObject({ isDirectory: expect.any(Function) });
});

test("rejects a coverage path that is a file", async () => {
  const root = await createRoot();
  await writeFile(join(root, "coverage"), "not a directory");
  await expect(prepareConsumerCoverageDirectory(root)).rejects.toThrow(
    "coverage must be a directory.",
  );
});
