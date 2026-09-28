import { expect, jest, test } from "@jest/globals";
import { createRepositoryAstSourceReader } from "../../src/checks/create-repository-ast-source-reader.mjs";

test("deduplicates concurrent reads for the same cache key", async () => {
  let resolveRead;
  const pending = new Promise((resolve) => {
    resolveRead = resolve;
  });
  const read = jest.fn(() => pending);
  const readSource = createRepositoryAstSourceReader(read);
  const first = readSource("key", "/repo/file.mjs");
  const second = readSource("key", "/repo/file.mjs");
  resolveRead("source");

  await expect(Promise.all([first, second])).resolves.toEqual(["source", "source"]);
  expect(read).toHaveBeenCalledTimes(1);
  expect(read).toHaveBeenCalledWith("/repo/file.mjs", "utf8");
});

test("uses supplied source without reading from disk", async () => {
  const read = jest.fn();
  const readSource = createRepositoryAstSourceReader(read);

  await expect(readSource("key", "/repo/file.mjs", "snapshot")).resolves.toBe("snapshot");
  expect(read).not.toHaveBeenCalled();
});

test("clears a failed read so a later request can retry", async () => {
  const read = jest
    .fn()
    .mockRejectedValueOnce(new Error("temporary read failure"))
    .mockResolvedValue("source");
  const readSource = createRepositoryAstSourceReader(read);

  await expect(readSource("key", "/repo/file.mjs")).rejects.toThrow("temporary read failure");
  await expect(readSource("key", "/repo/file.mjs")).resolves.toBe("source");
  expect(read).toHaveBeenCalledTimes(2);
});
