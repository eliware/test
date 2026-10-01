import { expect, jest, test } from "@jest/globals";
import { createRepositoryEntryReader } from "../../src/checks/create-repository-entry-reader.mjs";

function createReaderState() {
  let revision = 0;
  let records = [{ path: "one.mjs", type: "file" }];
  const findEntries = jest.fn(async () => records);
  const readDirectoryCached = jest.fn(async () => []);
  readDirectoryCached.getRevision = () => revision;
  readDirectoryCached.getTrackedDirectories = () => ["/repo"];
  const reader = createRepositoryEntryReader({
    root: "/repo",
    findEntries,
    readDirectoryCached,
    expandedDirectories: [],
    includeTestResults: false,
    includeTestResultsUnder: [],
  });
  return {
    reader,
    findEntries,
    readDirectoryCached,
    replaceRecords(value) {
      records = value;
      revision += 1;
    },
  };
}

test("reuses full entries while directory versions stay unchanged", async () => {
  const { reader, findEntries, readDirectoryCached } = createReaderState();
  expect(reader.hasFullDiscovery()).toBe(false);
  const initial = await reader.entries();
  expect(reader.hasFullDiscovery()).toBe(true);

  const refresh = reader.entries();
  expect(reader.entries()).toBe(refresh);
  await expect(refresh).resolves.toBe(initial);
  expect(findEntries).toHaveBeenCalledTimes(1);
  expect(readDirectoryCached).toHaveBeenCalledWith("/repo", true);
});

test("rediscovers when directory versions change", async () => {
  const { reader, findEntries, replaceRecords } = createReaderState();
  await reader.entries();
  replaceRecords([{ path: "two.mjs", type: "file" }]);

  await expect(reader.entries()).resolves.toEqual([{ path: "two.mjs", type: "file" }]);
  expect(findEntries).toHaveBeenCalledTimes(2);
});

test("rediscovers when a previously indexed directory disappears", async () => {
  const { reader, findEntries, readDirectoryCached } = createReaderState();
  await reader.entries();
  readDirectoryCached.mockRejectedValueOnce(new Error("directory removed"));
  findEntries.mockResolvedValueOnce([]);

  await expect(reader.entries()).resolves.toEqual([]);
  expect(findEntries).toHaveBeenCalledTimes(2);
});

test("retries discovery after a transient refresh failure", async () => {
  const { reader, findEntries, replaceRecords } = createReaderState();
  await reader.entries();
  replaceRecords([{ path: "recovered.mjs", type: "file" }]);
  findEntries.mockRejectedValueOnce(new Error("temporary read failure"));

  await expect(reader.entries()).rejects.toThrow("temporary read failure");
  await expect(reader.entries()).resolves.toEqual([{ path: "recovered.mjs", type: "file" }]);
  expect(findEntries).toHaveBeenCalledTimes(3);
});
