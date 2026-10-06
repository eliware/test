import { expect, test } from "@jest/globals";
import { join } from "node:path";
import {
  inventoryDirectory,
  inventoryPath,
} from "../../src/orchestration/repository-inventory-paths.mjs";

test("normalizes relative and absolute repository paths", () => {
  const root = join(process.cwd(), "inventory-fixture");
  expect(inventoryPath(root, "src/index.mjs")).toBe(join(root, "src", "index.mjs"));
  expect(inventoryPath(root, join(root, "README.md"))).toBe(join(root, "README.md"));
  expect(inventoryDirectory(root, join(root, "docs"), "outside")).toBe("docs");
  expect(inventoryDirectory(root, join(root, "docs", "name:part"), "outside")).toBe(
    "docs/name:part",
  );
  expect(inventoryDirectory(root, root, "outside")).toBe("");
  expect(() => inventoryDirectory(root, join(root, "..", "outside"), "outside")).toThrow("outside");
});
