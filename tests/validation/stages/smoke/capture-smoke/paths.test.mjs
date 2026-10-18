import { expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import { captureSmokePaths } from "../../../../../src/validation/stages/smoke/capture-smoke/paths.mjs";

test("captures each state path once for package files, package directory, and bin links", async () => {
  const checkedPaths = [];
  const parentChecks = [];
  const fs = {
    lstat: jest.fn(async (path) => {
      checkedPaths.push(path);
      throw Object.assign(new Error("missing"), { code: "ENOENT" });
    }),
  };
  const entries = await captureSmokePaths(
    "C:/consumer",
    "@eliware/test",
    ["eliware-test", "eliware-test"],
    "C:/smoke/backup",
    fs,
    "win32",
    async (root, name) => parentChecks.push([root, name]),
  );
  const expectedPaths = [
    join("C:/consumer", "package.json"),
    join("C:/consumer", "package-lock.json"),
    join("C:/consumer", "npm-shrinkwrap.json"),
    join("C:/consumer", "node_modules", ".package-lock.json"),
    join("C:/consumer", "node_modules", "@eliware", "test"),
    join("C:/consumer", "node_modules", ".bin", "eliware-test"),
    join("C:/consumer", "node_modules", ".bin", "eliware-test.cmd"),
    join("C:/consumer", "node_modules", ".bin", "eliware-test.ps1"),
  ];
  expect(checkedPaths).toEqual(expectedPaths);
  expect(parentChecks).toEqual(
    Array.from({ length: expectedPaths.length }, () => ["C:/consumer", "@eliware/test"]),
  );
  expect(entries).toEqual(expectedPaths.map((path) => ({ path, type: "missing" })));
});

test("captures paths when callers do not provide a parent check", async () => {
  const fs = {
    lstat: async () => {
      throw Object.assign(new Error("missing"), { code: "ENOENT" });
    },
  };
  await expect(
    captureSmokePaths("C:/consumer", "@eliware/test", [], "backup", fs, "linux"),
  ).resolves.toHaveLength(5);
});
