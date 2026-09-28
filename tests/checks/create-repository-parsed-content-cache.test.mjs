import { expect, jest, test } from "@jest/globals";
import { createRepositoryParsedContentCache } from "../../src/checks/create-repository-parsed-content-cache.mjs";

test("caches parsed values by normalized path and parser key", async () => {
  const readText = jest.fn(async () => '{"name":"fixture"}');
  const parse = jest.fn(JSON.parse);
  const readParsed = createRepositoryParsedContentCache("/repo", readText);

  const first = await readParsed("package.json", "json", parse);
  const repeated = await readParsed("/repo/package.json", "json", parse);
  const otherParserKey = await readParsed("package.json", "other", parse);

  expect(first).toEqual({ name: "fixture" });
  expect(repeated).toBe(first);
  expect(otherParserKey).not.toBe(first);
  expect(readText).toHaveBeenCalledTimes(3);
  expect(parse).toHaveBeenCalledTimes(2);
});

test("reparses content after the cached file text changes", async () => {
  const readText = jest
    .fn()
    .mockResolvedValueOnce('{"name":"before"}')
    .mockResolvedValue('{"name":"after"}');
  const parse = jest.fn(JSON.parse);
  const readParsed = createRepositoryParsedContentCache("/repo", readText);

  await expect(readParsed("package.json", "json", parse)).resolves.toEqual({ name: "before" });
  await expect(readParsed("package.json", "json", parse)).resolves.toEqual({ name: "after" });

  expect(readText).toHaveBeenCalledTimes(2);
  expect(parse).toHaveBeenCalledTimes(2);
});

test("keeps a newer parse cached when an older concurrent parse rejects", async () => {
  let rejectOldParse;
  const readText = jest
    .fn()
    .mockResolvedValueOnce('{"name":"old"}')
    .mockResolvedValue('{"name":"new"}');
  const parse = jest
    .fn()
    .mockImplementationOnce(() => new Promise((_, reject) => (rejectOldParse = reject)))
    .mockImplementation(JSON.parse);
  const readParsed = createRepositoryParsedContentCache("/repo", readText);
  const oldRead = readParsed("package.json", "json", parse);

  await expect(readParsed("package.json", "json", parse)).resolves.toEqual({ name: "new" });
  rejectOldParse(new Error("old parse failed"));
  await expect(oldRead).rejects.toThrow("old parse failed");
  await expect(readParsed("package.json", "json", parse)).resolves.toEqual({ name: "new" });

  expect(readText).toHaveBeenCalledTimes(3);
  expect(parse).toHaveBeenCalledTimes(2);
});

test("evicts rejected parses so a later read can retry", async () => {
  const readText = jest.fn(async () => '{"name":"fixture"}');
  const parse = jest
    .fn()
    .mockImplementationOnce(() => {
      throw new Error("temporary parse failure");
    })
    .mockImplementation(JSON.parse);
  const readParsed = createRepositoryParsedContentCache("/repo", readText);

  await expect(readParsed("package.json", "json", parse)).rejects.toThrow(
    "temporary parse failure",
  );
  await expect(readParsed("package.json", "json", parse)).resolves.toEqual({
    name: "fixture",
  });

  expect(readText).toHaveBeenCalledTimes(2);
  expect(parse).toHaveBeenCalledTimes(2);
});
