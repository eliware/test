import { expect, test } from "@jest/globals";
import { findLockfileDependencyEntry } from "../../../../../src/checks/general/E-0.1.0.1.1/validate/find-lockfile-dependency-entry.mjs";

test("finds dependencies at the nearest and root package levels", () => {
  const packages = {
    "node_modules/tool": {},
    "node_modules/parent/node_modules/tool": {},
  };
  expect(findLockfileDependencyEntry(packages, "node_modules/parent", "tool")).toBe(
    "node_modules/parent/node_modules/tool",
  );
  expect(
    findLockfileDependencyEntry(packages, "node_modules/parent/node_modules/child", "tool"),
  ).toBe("node_modules/parent/node_modules/tool");
});

test("returns null when no dependency entry exists", () => {
  expect(findLockfileDependencyEntry({}, "node_modules/parent", "tool")).toBeNull();
});
