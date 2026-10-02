import { expect, test } from "@jest/globals";
import { join, win32 } from "node:path";
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

test("rejects Windows absolute records for POSIX repository roots", () => {
  expect(
    normalizeRepositoryInventoryRecords("/repo", [
      { path: "C:\\outside\\file.mjs", type: "file" },
      { path: "\\\\server\\share\\file.mjs", type: "file" },
      { path: "src/file.mjs", type: "file" },
    ]),
  ).toEqual([{ path: "src/file.mjs", type: "file" }]);
});

test("normalizes Windows device-namespace repository roots with Windows path rules", () => {
  expect(
    normalizeRepositoryInventoryRecords("\\\\?\\C:\\repo", [
      { path: "\\\\?\\C:\\repo\\src\\file.mjs", type: "file" },
    ]),
  ).toEqual([{ path: "src/file.mjs", type: "file" }]);
});

test("drops null and malformed inventory records", () => {
  expect(normalizeRepositoryInventoryRecords("/repo", [null, undefined, {}, { path: 7 }])).toEqual(
    [],
  );
});

test("rejects POSIX-rooted records for Windows repositories", () => {
  expect(
    normalizeRepositoryInventoryRecords("C:\\repo", [
      { path: "/repo/file.mjs", type: "file" },
      { path: "//server/share/repo/file.mjs", type: "file" },
      { path: "C:outside\\file.mjs", type: "file" },
      { path: win32.join("C:\\repo", "src", "file.mjs"), type: "file" },
    ]),
  ).toEqual([{ path: "src/file.mjs", type: "file" }]);
});
