import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const readdir = jest.fn();
const fileSystem = await import("node:fs/promises");

jest.unstable_mockModule("node:fs/promises", () => ({ ...fileSystem, readdir }));

const { discoverChecks, discoverAllChecks } =
  await import("../../../../src/validation/check-discovery/discover/checks.mjs");

const file = (name) => ({ name, isDirectory: () => false, isFile: () => true });
const directory = (name) => ({ name, isDirectory: () => true, isFile: () => false });
const checkModule = async (url) => ({
  ruleId: url.pathname.split("/").at(-1).slice(0, -4),
  run() {},
});

beforeEach(() => readdir.mockReset());

test("rejects an unknown profile", async () => {
  readdir.mockRejectedValue(new Error("missing"));
  await expect(discoverChecks(["not-a-profile"])).rejects.toThrow("Unknown convention group");
});

test("returns an empty result when no profile is selected", async () => {
  await expect(discoverChecks([])).resolves.toEqual([]);
  expect(readdir).not.toHaveBeenCalled();
});

test("discovers nested checks, ignores unrelated files, and validates module contracts", async () => {
  const readDirectory = jest.fn(async (path) => {
    if (path.endsWith("E-9")) return [file("A-9.1.mjs")];
    if (path.endsWith("misc")) return [file("E-3.mjs")];
    return [
      directory("E-9"),
      directory("misc"),
      file("E-2.mjs"),
      file("A-2.mjs"),
      file("README.md"),
    ];
  });
  const checks = await discoverChecks(["demo"], {
    root: "C:/checks",
    readDirectory,
    importCheck: checkModule,
  });

  expect(checks.map(({ ruleId, parentRuleId }) => ({ ruleId, parentRuleId }))).toEqual([
    { ruleId: "A-2", parentRuleId: null },
    { ruleId: "E-2", parentRuleId: null },
    { ruleId: "E-3", parentRuleId: null },
    { ruleId: "A-9.1", parentRuleId: "E-9" },
  ]);
});

test("rejects invalid and duplicate check modules", async () => {
  const invalidReader = async () => [file("E-2.mjs")];
  await expect(
    discoverChecks(["demo"], {
      root: "C:/checks",
      readDirectory: invalidReader,
      importCheck: async () => ({ ruleId: "wrong", run() {} }),
    }),
  ).rejects.toThrow("Invalid check module");

  const duplicateReader = async () => [file("E-2.mjs")];
  await expect(
    discoverChecks(["demo", "other"], {
      root: "C:/checks",
      readDirectory: duplicateReader,
      importCheck: checkModule,
    }),
  ).rejects.toThrow("Duplicate check module");
});

test("discovers all visible groups in sorted order", async () => {
  const readDirectory = jest.fn(async (path) => {
    if (path === "C:/checks")
      return [directory("z-group"), directory("a-group"), directory(".hidden")];
    if (path.endsWith("z-group")) return [file("E-10.mjs")];
    if (path.endsWith("a-group")) return [file("E-2.mjs")];
    return [];
  });
  const checks = await discoverAllChecks({
    root: "C:/checks",
    readDirectory,
    importCheck: checkModule,
  });

  expect(checks.map(({ ruleId }) => ruleId)).toEqual(["E-2", "E-10"]);
});

test("supports empty discovery options", async () => {
  await expect(
    discoverAllChecks({ root: "C:/empty", readDirectory: async () => [] }),
  ).resolves.toEqual([]);
  await expect(discoverAllChecks({ readDirectory: async () => [] })).resolves.toEqual([]);
  expect(readdir).not.toHaveBeenCalled();
});

test("imports a discovered check with the default loader", async () => {
  const root = join(process.cwd(), "src", "checks");
  const readDirectory = async () => [file("E-0.1.0.1.0.mjs")];

  await expect(discoverChecks(["general"], { root, readDirectory })).resolves.toMatchObject([
    { ruleId: "E-0.1.0.1.0", parentRuleId: null },
  ]);
});

test("uses the bundled source checks directory by default", async () => {
  readdir.mockResolvedValue([]);
  await expect(discoverAllChecks()).resolves.toEqual([]);
  expect(readdir).toHaveBeenCalledWith(expect.stringMatching(/[\\/]src[\\/]checks$/u), {
    withFileTypes: true,
  });
});

test("treats a missing default checks directory as an empty registry", async () => {
  readdir.mockRejectedValueOnce(Object.assign(new Error("missing"), { code: "ENOENT" }));
  await expect(discoverAllChecks()).resolves.toEqual([]);
});

test("propagates other directory read failures", async () => {
  const denied = new Error("denied");
  await expect(
    discoverAllChecks({
      root: "explicit-root",
      readDirectory: async () => {
        throw denied;
      },
    }),
  ).rejects.toBe(denied);
});
