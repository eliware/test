import { expect, test } from "@jest/globals";
import { join } from "node:path";
import { normalizeRepositoryInventoryRecords } from "../../src/checks/normalize-repository-inventory-records.mjs";

test("normalizes absolute records inside the repository and drops outside records", () => {
  const root = process.cwd();
  expect(
    normalizeRepositoryInventoryRecords(root, [
      { path: join(root, "docs", "guide.md"), type: "file" },
      { path: join(root, "..", "outside.md"), type: "file" },
    ]),
  ).toEqual([{ path: "docs/guide.md", type: "file" }]);
});

test("normalizes relative record paths without changing metadata", () => {
  expect(
    normalizeRepositoryInventoryRecords("/repo", [
      { path: "docs/guide.md", type: "file", depth: 2 },
    ]),
  ).toEqual([{ path: "docs/guide.md", type: "file", depth: 2 }]);
});

test("drops null and malformed inventory records", () => {
  expect(normalizeRepositoryInventoryRecords("/repo", [null, undefined, {}, { path: 7 }])).toEqual(
    [],
  );
});
