import { expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const fileSystem = await import("node:fs/promises");
const readDirectory = jest.fn((directory, options) => {
  if (String(directory).replaceAll("\\", "/").endsWith("/src/checks")) return Promise.resolve([]);
  return fileSystem.readdir(directory, options);
});
jest.unstable_mockModule("node:fs/promises", () => ({ ...fileSystem, readdir: readDirectory }));
const { discoverChecks, discoverAllChecks } =
  await import("../../src/orchestrators/discover-checks.mjs");

test("rejects an unknown profile", async () => {
  await expect(discoverChecks(["not-a-profile"])).rejects.toThrow("Unknown convention group");
});

test("returns an empty result when no profile is selected", async () => {
  await expect(discoverChecks([])).resolves.toEqual([]);
});

test("discovers nested checks, ignores unrelated files, and validates module contracts", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-discovery-"));
  const group = join(root, "demo");
  await mkdir(join(group, "E-9"), { recursive: true });
  await mkdir(join(group, "misc"));
  await writeFile(join(group, "E-2.mjs"), 'export const ruleId = "E-2"; export function run() {}');
  await writeFile(join(group, "A-2.mjs"), 'export const ruleId = "A-2"; export function run() {}');
  await writeFile(
    join(group, "E-9", "A-9.1.mjs"),
    'export const ruleId = "A-9.1"; export function run() {}',
  );
  await writeFile(
    join(group, "misc", "E-3.mjs"),
    'export const ruleId = "E-3"; export function run() {}',
  );
  await writeFile(join(group, "README.md"), "ignored");
  const checks = await discoverChecks(["demo"], { root });
  expect(checks.map(({ ruleId, parentRuleId }) => ({ ruleId, parentRuleId }))).toEqual([
    { ruleId: "A-2", parentRuleId: null },
    { ruleId: "E-2", parentRuleId: null },
    { ruleId: "E-3", parentRuleId: null },
    { ruleId: "A-9.1", parentRuleId: "E-9" },
  ]);
  await rm(root, { recursive: true, force: true });
});

test("rejects invalid and duplicate check modules", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-discovery-invalid-"));
  await mkdir(join(root, "demo"), { recursive: true });
  await writeFile(
    join(root, "demo", "E-2.mjs"),
    'export const ruleId = "wrong"; export function run() {}',
  );
  await expect(discoverChecks(["demo"], { root })).rejects.toThrow("Invalid check module");
  const duplicateRoot = await mkdtemp(join(tmpdir(), "eliware-test-discovery-duplicate-"));
  await mkdir(join(duplicateRoot, "demo"));
  await mkdir(join(duplicateRoot, "other"));
  await writeFile(
    join(duplicateRoot, "demo", "E-2.mjs"),
    'export const ruleId = "E-2"; export function run() {}',
  );
  await writeFile(
    join(duplicateRoot, "other", "E-2.mjs"),
    'export const ruleId = "E-2"; export function run() {}',
  );
  await expect(discoverChecks(["demo", "other"], { root: duplicateRoot })).rejects.toThrow(
    "Duplicate check module",
  );
  await rm(root, { recursive: true, force: true });
  await rm(duplicateRoot, { recursive: true, force: true });
});

test("discovers all visible groups in sorted order", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-discovery-all-"));
  await mkdir(join(root, "z-group"));
  await mkdir(join(root, "a-group"));
  await mkdir(join(root, ".hidden"));
  await writeFile(join(root, "README.md"), "ignored");
  await writeFile(
    join(root, "z-group", "E-10.mjs"),
    'export const ruleId = "E-10"; export function run() {}',
  );
  await writeFile(
    join(root, "a-group", "E-2.mjs"),
    'export const ruleId = "E-2"; export function run() {}',
  );
  const checks = await discoverAllChecks({ root });
  expect(checks.map(({ ruleId }) => ruleId)).toEqual(["E-2", "E-10"]);
  await rm(root, { recursive: true, force: true });
});

test("supports discoverAllChecks default options", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-discovery-empty-"));
  await expect(discoverAllChecks({ root })).resolves.toEqual([]);
  await expect(discoverAllChecks({ readDirectory: async () => [] })).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});

test("uses the default filesystem and options without scanning the bundled registry", async () => {
  await expect(discoverAllChecks()).resolves.toEqual([]);
});
