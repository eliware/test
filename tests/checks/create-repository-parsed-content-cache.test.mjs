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
  expect(readText).toHaveBeenCalledTimes(2);
  expect(parse).toHaveBeenCalledTimes(2);
});
