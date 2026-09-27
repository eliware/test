import { expect, jest, test } from "@jest/globals";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  readRepositoryParsed,
  readRepositoryText,
} from "../../src/checks/read-repository-text.mjs";

test("shares file reads within one validation context and rereads in another", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-text-cache-"));
  const filePath = join(root, "README.md");

  try {
    await writeFile(filePath, "first");
    const context = {};
    const first = readRepositoryText(context, filePath);
    expect(readRepositoryText(context, filePath)).toBe(first);
    await expect(first).resolves.toBe("first");

    await writeFile(filePath, "second");
    await expect(readRepositoryText(context, filePath)).resolves.toBe("first");
    await expect(readRepositoryText({}, filePath)).resolves.toBe("second");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reads directly without a validation context", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-text-cache-"));
  const filePath = join(root, "AGENTS.md");

  try {
    await writeFile(filePath, "first");
    await expect(readRepositoryText(null, filePath)).resolves.toBe(
      await readFile(filePath, "utf8"),
    );
    await writeFile(filePath, "second");
    await expect(readRepositoryText(null, filePath)).resolves.toBe("second");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("caches parsed sections by repository path and cache key within one run", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-text-cache-"));
  const filePath = join(root, "AGENTS.md");

  try {
    await writeFile(filePath, "## Project\nPurpose");
    const context = {};
    const parse = jest.fn((text) => text.split("\n")[1]);
    const first = await readRepositoryParsed(context, filePath, "section:project", parse);
    const second = await readRepositoryParsed(context, filePath, "section:project", parse);
    expect(first).toBe("Purpose");
    expect(second).toBe(first);
    expect(parse).toHaveBeenCalledTimes(1);

    await readRepositoryParsed(context, filePath, "section:other", parse);
    expect(parse).toHaveBeenCalledTimes(2);
    await writeFile(filePath, "## Project\nChanged");
    await expect(readRepositoryParsed({}, filePath, "section:project", parse)).resolves.toBe(
      "Changed",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not cache parsed results without a validation context", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-text-cache-"));
  const filePath = join(root, "README.md");

  try {
    await writeFile(filePath, "first");
    const parse = jest.fn((text) => text);
    await readRepositoryParsed(null, filePath, "parsed", parse);
    await writeFile(filePath, "second");
    await expect(readRepositoryParsed(null, filePath, "parsed", parse)).resolves.toBe("second");
    expect(parse).toHaveBeenCalledTimes(2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
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
