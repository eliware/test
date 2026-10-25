import { expect, jest, test } from "@jest/globals";
import { loadSpecificationIndexInventory } from "../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/inventory.mjs";

test("discovers specification entries and groups them by directory", async () => {
  const list = jest.fn(async (path) => {
    if (path.endsWith("specs"))
      return [
        { name: "rules.yaml", isDirectory: () => false, isFile: () => true },
        { name: "nested", isDirectory: () => true, isFile: () => false },
      ];
    return [{ name: "child.yaml", isDirectory: () => false, isFile: () => true }];
  });

  const inventory = await loadSpecificationIndexInventory("repo", list);
  expect(inventory.directories).toEqual(["specs", "specs/nested"]);
  expect(inventory.filesByDirectory.get("specs").map(({ path }) => path)).toEqual([
    "specs/rules.yaml",
  ]);
  expect(inventory.filesByDirectory.get("specs/nested").map(({ path }) => path)).toEqual([
    "specs/nested/child.yaml",
  ]);
});
