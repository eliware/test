import { beforeEach, expect, jest, test } from "@jest/globals";

const readFile = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ readFile }));

const { readRepositoryParsed, readRepositoryText } =
  await import("../../../../../src/validation/shared/repository/read/repository-text.mjs");

beforeEach(() => readFile.mockReset());

test("shares file reads within one validation context and rereads in another", async () => {
  readFile.mockResolvedValueOnce("first").mockResolvedValueOnce("second");
  const context = {};
  const first = readRepositoryText(context, "C:/repo/README.md");

  expect(readRepositoryText(context, "C:/repo/README.md")).toBe(first);
  await expect(first).resolves.toBe("first");
  await expect(readRepositoryText({}, "C:/repo/README.md")).resolves.toBe("second");
  expect(readFile).toHaveBeenCalledTimes(2);
});

test("reads directly without a validation context", async () => {
  readFile.mockResolvedValueOnce("first").mockResolvedValueOnce("second");

  await expect(readRepositoryText(null, "C:/repo/AGENTS.md")).resolves.toBe("first");
  await expect(readRepositoryText(null, "C:/repo/AGENTS.md")).resolves.toBe("second");
});

test("caches parsed sections by repository path and cache key within one run", async () => {
  readFile
    .mockResolvedValueOnce("## Project\nPurpose")
    .mockResolvedValueOnce("## Project\nChanged");
  const context = {};
  const parse = jest.fn((text) => text.split("\n")[1]);

  const first = await readRepositoryParsed(context, "C:/repo/AGENTS.md", "section:project", parse);
  const second = await readRepositoryParsed(context, "C:/repo/AGENTS.md", "section:project", parse);
  expect(first).toBe("Purpose");
  expect(second).toBe(first);
  expect(parse).toHaveBeenCalledTimes(1);

  await readRepositoryParsed(context, "C:/repo/AGENTS.md", "section:other", parse);
  expect(parse).toHaveBeenCalledTimes(2);
  await expect(
    readRepositoryParsed({}, "C:/repo/AGENTS.md", "section:project", parse),
  ).resolves.toBe("Changed");
});

test("does not cache parsed results without a validation context", async () => {
  readFile.mockResolvedValueOnce("first").mockResolvedValueOnce("second");
  const parse = jest.fn((text) => text);

  await readRepositoryParsed(null, "C:/repo/README.md", "parsed", parse);
  await expect(readRepositoryParsed(null, "C:/repo/README.md", "parsed", parse)).resolves.toBe(
    "second",
  );
  expect(parse).toHaveBeenCalledTimes(2);
});

test("delegates text and parsed reads to the run inventory", async () => {
  const repositoryInventory = {
    readText: jest.fn(async () => "shared"),
    readParsed: jest.fn(async (_filePath, _cacheKey, parse) => parse('{"value":1}')),
  };
  const context = { repositoryInventory };

  await expect(readRepositoryText(context, "README.md")).resolves.toBe("shared");
  await expect(readRepositoryParsed(context, "record.json", "json", JSON.parse)).resolves.toEqual({
    value: 1,
  });
  expect(repositoryInventory.readText).toHaveBeenCalledWith("README.md");
  expect(repositoryInventory.readParsed).toHaveBeenCalledWith("record.json", "json", JSON.parse);
});
