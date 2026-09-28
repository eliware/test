import { expect, jest, test } from "@jest/globals";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRepositoryFileContentCache } from "../../src/checks/create-repository-file-content-cache.mjs";

test("shares one byte read across byte and text access", async () => {
  const read = jest.fn(async () => Buffer.from("text content"));
  const cache = createRepositoryFileContentCache("/repo", read, async () => ({
    dev: 1n,
    ino: 2n,
    size: 12n,
    mtimeNs: 1n,
    ctimeNs: 1n,
  }));

  const bytes = cache.readBytes("README.md");
  const text = cache.readText("/repo/README.md");
  await expect(bytes).resolves.toEqual(Buffer.from("text content"));
  await expect(text).resolves.toBe("text content");
  await expect(cache.readText("README.md")).resolves.toBe("text content");
  expect(read).toHaveBeenCalledTimes(1);
});

test("normalizes text reader results for byte access", async () => {
  const cache = createRepositoryFileContentCache(
    "/repo",
    jest.fn(async () => "text content"),
    async () => ({ dev: 1n, ino: 2n, size: 12n, mtimeNs: 1n, ctimeNs: 1n }),
  );

  await expect(cache.readBytes("README.md")).resolves.toEqual(Buffer.from("text content"));
  await expect(cache.readText("README.md")).resolves.toBe("text content");
});

test("reuses file content only while its on-disk version is unchanged", async () => {
  const metadata = (mtimeNs) => ({
    dev: 1n,
    ino: 2n,
    size: 4n,
    mtimeNs,
    ctimeNs: mtimeNs,
  });
  const stat = jest
    .fn()
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(2n))
    .mockResolvedValueOnce(metadata(2n))
    .mockResolvedValueOnce(metadata(2n))
    .mockResolvedValueOnce(metadata(2n));
  const read = jest.fn().mockResolvedValueOnce("old!").mockResolvedValueOnce("new!");
  const cache = createRepositoryFileContentCache("/repo", read, stat);

  await expect(cache.readText("README.md")).resolves.toBe("old!");
  await expect(cache.readText("README.md")).resolves.toBe("old!");
  await expect(cache.readText("README.md")).resolves.toBe("new!");
  expect(read).toHaveBeenCalledTimes(2);
  expect(stat).toHaveBeenCalledWith(expect.stringMatching(/repo\\README\.md$/u), { bigint: true });
});

test("refreshes a cache hit when the file changes between version checks", async () => {
  const metadata = (mtimeNs) => ({
    dev: 1n,
    ino: 2n,
    size: 4n,
    mtimeNs,
    ctimeNs: mtimeNs,
  });
  const stat = jest
    .fn()
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(2n))
    .mockResolvedValueOnce(metadata(2n))
    .mockResolvedValueOnce(metadata(2n));
  const read = jest.fn().mockResolvedValueOnce("old!").mockResolvedValueOnce("new!");
  const cache = createRepositoryFileContentCache("/repo", read, stat);

  await expect(cache.readText("README.md")).resolves.toBe("old!");
  await expect(cache.readText("README.md")).resolves.toBe("new!");
  expect(read).toHaveBeenCalledTimes(2);
});

test("uses filesystem versions by default and refreshes changed file content", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-file-cache-"));
  const path = join(root, "README.md");
  await writeFile(path, "old");
  const read = jest.fn((filePath) => readFile(filePath));
  const cache = createRepositoryFileContentCache(root, read);

  try {
    await expect(cache.readText(path)).resolves.toBe("old");
    await writeFile(path, "new content");
    await expect(cache.readText(path)).resolves.toBe("new content");
    expect(read).toHaveBeenCalledTimes(2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("drops failed reads so a later request can retry", async () => {
  const stat = jest
    .fn()
    .mockRejectedValueOnce(new Error("stat denied"))
    .mockResolvedValue({ dev: 1n, ino: 2n, size: 4n, mtimeNs: 1n, ctimeNs: 1n });
  const read = jest.fn().mockResolvedValue("text");
  const cache = createRepositoryFileContentCache("/repo", read, stat);

  await expect(cache.readText("README.md")).rejects.toThrow("stat denied");
  await expect(cache.readText("README.md")).resolves.toBe("text");
  expect(read).toHaveBeenCalledTimes(1);
});

test("stores the stable version when a file changes during a cache fill", async () => {
  let currentVersion = 1n;
  const stat = jest.fn(async () => ({
    dev: 1n,
    ino: 2n,
    size: 5n,
    mtimeNs: currentVersion,
    ctimeNs: currentVersion,
  }));
  const read = jest.fn(async () => {
    if (read.mock.calls.length === 1) {
      currentVersion = 2n;
      return "stale";
    }
    return "fresh";
  });
  const cache = createRepositoryFileContentCache("/repo", read, stat);

  await expect(cache.readText("README.md")).resolves.toBe("fresh");
  await expect(cache.readText("README.md")).resolves.toBe("fresh");
  expect(read).toHaveBeenCalledTimes(2);
});
