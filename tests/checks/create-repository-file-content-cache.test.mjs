import { expect, jest, test } from "@jest/globals";
import { createRepositoryFileContentCache } from "../../src/checks/create-repository-file-content-cache.mjs";

test("shares one byte read across byte and text access", async () => {
  const read = jest.fn(async () => Buffer.from("text content"));
  const cache = createRepositoryFileContentCache("/repo", read);

  await expect(cache.readBytes("README.md")).resolves.toEqual(Buffer.from("text content"));
  await expect(cache.readText("/repo/README.md")).resolves.toBe("text content");
  await expect(cache.readText("README.md")).resolves.toBe("text content");
  expect(read).toHaveBeenCalledTimes(1);
});

test("normalizes text reader results for byte access", async () => {
  const cache = createRepositoryFileContentCache(
    "/repo",
    jest.fn(async () => "text content"),
  );

  await expect(cache.readBytes("README.md")).resolves.toEqual(Buffer.from("text content"));
  await expect(cache.readText("README.md")).resolves.toBe("text content");
});
