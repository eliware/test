import { expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import {
  inventoryDirectory,
  inventoryPath,
  createDirectoryReadCache,
} from "../../src/checks/repository-inventory-paths.mjs";

test("normalizes relative and absolute repository paths", () => {
  const root = join(process.cwd(), "inventory-fixture");
  expect(inventoryPath(root, "src/index.mjs")).toBe(join(root, "src", "index.mjs"));
  expect(inventoryPath(root, join(root, "README.md"))).toBe(join(root, "README.md"));
  expect(inventoryDirectory(root, join(root, "docs"), "outside")).toBe("docs");
  expect(inventoryDirectory(root, root, "outside")).toBe("");
  expect(() => inventoryDirectory(root, join(root, "..", "outside"), "outside")).toThrow("outside");
});

test("caches directory reads by normalized absolute path", async () => {
  const root = join(process.cwd(), "inventory-fixture");
  const readDirectory = jest.fn(async () => []);
  const read = createDirectoryReadCache(root, readDirectory);

  const first = read("src");
  const second = read(join(root, "src"));
  expect(second).toBe(first);
  await expect(first).resolves.toEqual([]);
  expect(readDirectory).toHaveBeenCalledTimes(1);
  expect(readDirectory).toHaveBeenCalledWith(join(root, "src"), { withFileTypes: true });
});
