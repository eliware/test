import { expect, jest, test } from "@jest/globals";
import { platform } from "node:os";
import { posix, resolve } from "node:path";
import { createRepositoryInventory } from "../../../../src/validation/shared/repository/create-repository-inventory.mjs";

test("composes a frozen inventory facade over shared repository discovery", async () => {
  const findEntries = jest.fn(async () => [
    { path: "README.md", type: "file", depth: 0 },
    { path: "src", type: "directory", depth: 1 },
    { path: "src/index.mjs", type: "file", depth: 1 },
  ]);
  const inventory = createRepositoryInventory("/repo", { findEntries });

  expect(Object.isFrozen(inventory)).toBe(true);
  expect(inventory.root).toBe("/repo");
  await expect(inventory.repositoryFiles()).resolves.toEqual(["README.md", "src/index.mjs"]);
  expect(findEntries).toHaveBeenCalledTimes(1);
  expect(findEntries).toHaveBeenCalledWith(
    "/repo",
    expect.any(Function),
    expect.objectContaining({
      includeTestResults: false,
      includeTestResultsUnder: [],
      expandedDirectories: [],
    }),
  );
});

test("provides the default discovery configuration when options are omitted", () => {
  const inventory = createRepositoryInventory("/repo");

  expect(inventory).toMatchObject({ root: "/repo", focusedScope: null });
  expect(inventory.repositoryFiles).toEqual(expect.any(Function));
});

test("normalizes a relative repository root", () => {
  expect(createRepositoryInventory("relative-repository").root).toBe(
    resolve("relative-repository"),
  );
});

test("uses POSIX path rules for a simulated non-Windows host", () => {
  expect(createRepositoryInventory("relative-repository", {}, "linux").root).toBe(
    posix.resolve("relative-repository"),
  );
});

test.each([
  String.raw`C:\workspace\repo`,
  String.raw`\\server\share\repo`,
  String.raw`\\?\C:\workspace\repo`,
  String.raw`\\.\C:\workspace\repo`,
])("handles Windows absolute repository root %s only on Windows hosts", (root) => {
  if (platform() !== "win32") {
    expect(() => createRepositoryInventory(root)).toThrow(
      "Windows repository inventory roots require a Windows host.",
    );
    return;
  }
  expect(createRepositoryInventory(root).root).toBe(root);
});

test("rejects Windows roots for a simulated non-Windows host", () => {
  expect(() => createRepositoryInventory(String.raw`C:\workspace\repo`, {}, "linux")).toThrow(
    "Windows repository inventory roots require a Windows host.",
  );
  expect(createRepositoryInventory(String.raw`C:\workspace\repo`, {}, "win32").root).toBe(
    String.raw`C:\workspace\repo`,
  );
});

test.each([undefined, null, "", "  ", 7])("rejects invalid inventory root %p", (root) => {
  expect(() => createRepositoryInventory(root)).toThrow(
    "Repository inventory root must be a non-empty path string.",
  );
});
