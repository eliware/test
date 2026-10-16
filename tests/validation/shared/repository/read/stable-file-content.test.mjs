import { expect, jest, test } from "@jest/globals";

const stat = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ stat }));

const { readStableFileContent } =
  await import("../../../../../src/validation/shared/repository/read/stable-file-content.mjs");

const metadata = (version) => ({
  dev: 1n,
  ino: 2n,
  size: 4n,
  mtimeNs: version,
  ctimeNs: version,
});

test("retries when a file changes between its pre-read and post-read stats", async () => {
  let currentVersion = 1n;
  const stat = jest.fn(async () => metadata(currentVersion));
  const read = jest.fn(async () => {
    if (read.mock.calls.length === 1) {
      currentVersion = 2n;
      return "stale";
    }
    return "fresh";
  });

  await expect(readStableFileContent("README.md", read, stat)).resolves.toEqual({
    content: Buffer.from("fresh"),
    version: "1:2:4:2:2",
  });
  expect(read).toHaveBeenCalledTimes(2);
  expect(stat).toHaveBeenCalledTimes(4);
});

test("rejects a file that keeps changing during bounded retries", async () => {
  let currentVersion = 0n;
  const stat = jest.fn(async () => metadata(currentVersion));
  const read = jest.fn(async () => {
    currentVersion += 1n;
    return "changing";
  });

  await expect(readStableFileContent("README.md", read, stat)).rejects.toThrow(
    "File changed while reading repository content",
  );
  expect(read).toHaveBeenCalledTimes(2);
  expect(stat).toHaveBeenCalledTimes(4);
});

test("uses filesystem stat by default", async () => {
  stat.mockResolvedValue(metadata(1n));
  const read = jest.fn().mockResolvedValue("text");

  await expect(readStableFileContent("C:/repo/README.md", read)).resolves.toMatchObject({
    content: Buffer.from("text"),
  });
  expect(stat).toHaveBeenCalledTimes(2);
});

test("keeps buffer content without converting it", async () => {
  stat.mockResolvedValue(metadata(1n));
  const content = Buffer.from("text");

  await expect(
    readStableFileContent("C:/repo/README.md", jest.fn().mockResolvedValue(content)),
  ).resolves.toMatchObject({ content });
});
