import { expect, jest, test } from "@jest/globals";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRepositoryFileContentCache } from "../../../../src/validation/shared/repository/create-repository-file-content-cache.mjs";
const fileVersion = (mtimeNs, size = 4n) => ({ dev: 1n, ino: 2n, size, mtimeNs, ctimeNs: mtimeNs });
test("shares one byte read across byte and text access", async () => {
  const read = jest.fn(async () => "text content");
  const cache = createRepositoryFileContentCache("/repo", read, async () => fileVersion(1n, 12n));
  const bytes = cache.readBytes("README.md");
  const text = cache.readText("/repo/README.md");
  await expect(bytes).resolves.toEqual(Buffer.from("text content"));
  await expect(text).resolves.toBe("text content");
  await expect(cache.readText("README.md")).resolves.toBe("text content");
  expect(read).toHaveBeenCalledTimes(1);
});
test("evicts cached file bytes after the bounded content budget is exceeded", async () => {
  const largeContent = Buffer.allocUnsafe(9);
  const read = jest.fn(async () => largeContent);
  const cache = createRepositoryFileContentCache(
    "/repo",
    read,
    async () => fileVersion(1n, BigInt(largeContent.byteLength)),
    8,
  );
  await expect(cache.readBytes("large.bin")).resolves.toBe(largeContent);
  await expect(cache.readBytes("large.bin")).resolves.toBe(largeContent);
  expect(read).toHaveBeenCalledTimes(2);
});
test("skips an in-flight read while evicting older completed entries", async () => {
  let releasePending;
  const pendingRead = new Promise((resolve) => {
    releasePending = resolve;
  });
  const read = jest.fn((path) => {
    if (path.endsWith("pending.bin")) return pendingRead;
    if (path.endsWith("older.bin")) return Promise.resolve(Buffer.alloc(7));
    return Promise.resolve(Buffer.alloc(3));
  });
  const stat = jest.fn(async (path) =>
    fileVersion(1n, path.endsWith("older.bin") ? 7n : path.endsWith("current.bin") ? 3n : 4n),
  );
  const cache = createRepositoryFileContentCache("/repo", read, stat, 8);
  const pending = cache.readBytes("pending.bin");
  await expect(cache.readBytes("older.bin")).resolves.toHaveLength(7);
  await expect(cache.readBytes("current.bin")).resolves.toHaveLength(3);
  releasePending(Buffer.from("hold"));
  await expect(pending).resolves.toHaveLength(4);
});
test("reuses file content only while its on-disk version is unchanged", async () => {
  const stat = jest
    .fn()
    .mockResolvedValueOnce(fileVersion(1n))
    .mockResolvedValueOnce(fileVersion(1n))
    .mockResolvedValueOnce(fileVersion(1n))
    .mockResolvedValueOnce(fileVersion(1n))
    .mockResolvedValueOnce(fileVersion(1n))
    .mockResolvedValueOnce(fileVersion(1n))
    .mockResolvedValueOnce(fileVersion(2n))
    .mockResolvedValueOnce(fileVersion(2n))
    .mockResolvedValueOnce(fileVersion(2n));
  const read = jest.fn().mockResolvedValueOnce("old!").mockResolvedValueOnce("new!");
  const cache = createRepositoryFileContentCache("/repo", read, stat);
  await expect(cache.readText("README.md")).resolves.toBe("old!");
  await expect(cache.readText("README.md")).resolves.toBe("old!");
  await expect(cache.readText("README.md")).resolves.toBe("new!");
  expect(read).toHaveBeenCalledTimes(2);
  expect(stat).toHaveBeenCalledWith(expect.stringMatching(/[\\/]repo[\\/]README\.md$/u), {
    bigint: true,
  });
});
test("keeps byte accounting correct after a failed cache replacement", async () => {
  let version = 1n;
  const stat = jest.fn(async (path) => fileVersion(version, path.endsWith("large.bin") ? 5n : 4n));
  const largeContent = Buffer.from("12345");
  const read = jest
    .fn()
    .mockResolvedValueOnce("old!")
    .mockRejectedValueOnce(new Error("temporary read failure"))
    .mockResolvedValueOnce("new!")
    .mockResolvedValueOnce(largeContent)
    .mockResolvedValueOnce("new!");
  const cache = createRepositoryFileContentCache("/repo", read, stat, 8);
  await expect(cache.readText("small.txt")).resolves.toBe("old!");
  version = 2n;
  await expect(cache.readText("small.txt")).rejects.toThrow("temporary read failure");
  await expect(cache.readText("small.txt")).resolves.toBe("new!");
  await expect(cache.readBytes("large.bin")).resolves.toBe(largeContent);
  await expect(cache.readBytes("small.txt")).resolves.toEqual(Buffer.from("new!"));
  expect(read).toHaveBeenCalledTimes(5);
});
test("keeps an in-flight previous entry accounted while another read evicts content", async () => {
  let currentVersion = 1n;
  let rejectRefresh;
  const largeContent = Buffer.allocUnsafe(9);
  const stat = jest.fn(async (path) =>
    fileVersion(currentVersion, path.endsWith("large.bin") ? 9n : 4n),
  );
  const read = jest.fn((path) => {
    if (path.endsWith("small.txt") && read.mock.calls.length === 1) return Promise.resolve("old!");
    if (path.endsWith("small.txt"))
      return new Promise((_resolve, reject) => {
        rejectRefresh = reject;
      });
    return Promise.resolve(largeContent);
  });
  const cache = createRepositoryFileContentCache("/repo", read, stat, 8);
  await expect(cache.readText("small.txt")).resolves.toBe("old!");
  currentVersion = 2n;
  const refresh = cache.readText("small.txt");
  await new Promise((resolve) => setImmediate(resolve));
  await expect(cache.readBytes("large.bin")).resolves.toBe(largeContent);
  rejectRefresh(new Error("refresh failed"));
  await expect(refresh).rejects.toThrow("refresh failed");
  currentVersion = 1n;
  await expect(cache.readText("small.txt")).resolves.toBe("old!");
  expect(read).toHaveBeenCalledTimes(3);
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
test("shares concurrent failures until they settle, then allows a retry", async () => {
  let rejectStat;
  const stat = jest
    .fn()
    .mockImplementationOnce(() => new Promise((_resolve, reject) => (rejectStat = reject)))
    .mockResolvedValue({ dev: 1n, ino: 2n, size: 4n, mtimeNs: 1n, ctimeNs: 1n });
  const cache = createRepositoryFileContentCache("/repo", async () => "retry", stat);
  const first = cache.readBytes("README.md");
  const concurrent = cache.readBytes("/repo/README.md");
  expect(concurrent).toBe(first);
  await new Promise((resolve) => setImmediate(resolve));
  rejectStat(new Error("stat denied"));
  await expect(first).rejects.toThrow("stat denied");
  await expect(cache.readText("README.md")).resolves.toBe("retry");
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
