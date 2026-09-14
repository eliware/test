import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { discoverChecks, discoverAllChecks } from "../../src/orchestrators/discover-checks.mjs";

test("discovers and sorts checks from an explicit profile", async () => {
  const checks = await discoverChecks(["application"]);
  expect(checks.length).toBeGreaterThan(0);
  expect(checks[0].ruleId).toBe("E-1.130");
  expect(checks.every((check) => typeof check.run === "function")).toBe(true);
});

test("rejects an unknown profile", async () => {
  await expect(discoverChecks(["not-a-profile"])).rejects.toThrow("Unknown convention group");
});

test("discovers nested checks, ignores unrelated files, and validates module contracts", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-discovery-"));
  const group = join(root, "demo");
  await mkdir(join(group, "E-9"), { recursive: true });
  await mkdir(join(group, "misc"));
  await writeFile(join(group, "E-2.mjs"), 'export const ruleId = "E-2"; export function run() {}');
  await writeFile(join(group, "A-2.mjs"), 'export const ruleId = "A-2"; export function run() {}');
  await writeFile(join(group, "E-9", "A-9.1.mjs"), 'export const ruleId = "A-9.1"; export function run() {}');
  await writeFile(join(group, "misc", "E-3.mjs"), 'export const ruleId = "E-3"; export function run() {}');
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
  await writeFile(join(root, "demo", "E-2.mjs"), 'export const ruleId = "wrong"; export function run() {}');
  await expect(discoverChecks(["demo"], { root })).rejects.toThrow("Invalid check module");
  const duplicateRoot = await mkdtemp(join(tmpdir(), "eliware-test-discovery-duplicate-"));
  await mkdir(join(duplicateRoot, "demo"));
  await mkdir(join(duplicateRoot, "other"));
  await writeFile(join(duplicateRoot, "demo", "E-2.mjs"), 'export const ruleId = "E-2"; export function run() {}');
  await writeFile(join(duplicateRoot, "other", "E-2.mjs"), 'export const ruleId = "E-2"; export function run() {}');
  await expect(discoverChecks(["demo", "other"], { root: duplicateRoot })).rejects.toThrow("Duplicate check module");
  await rm(root, { recursive: true, force: true });
  await rm(duplicateRoot, { recursive: true, force: true });
});

test("discovers all visible groups in sorted order", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-discovery-all-"));
  await mkdir(join(root, "z-group"));
  await mkdir(join(root, "a-group"));
  await mkdir(join(root, ".hidden"));
  await writeFile(join(root, "README.md"), "ignored");
  await writeFile(join(root, "z-group", "E-10.mjs"), 'export const ruleId = "E-10"; export function run() {}');
  await writeFile(join(root, "a-group", "E-2.mjs"), 'export const ruleId = "E-2"; export function run() {}');
  const checks = await discoverAllChecks({ root });
  expect(checks.map(({ ruleId }) => ruleId)).toEqual(["E-2", "E-10"]);
  await rm(root, { recursive: true, force: true });
});

test("supports discoverAllChecks default options", async () => {
  await expect(discoverAllChecks({ readDirectory: async () => [] })).resolves.toEqual([]);
  await expect(discoverAllChecks()).resolves.toEqual(expect.any(Array));
});

test("keeps the bundled registry unique and executable", async () => {
  const checks = await discoverAllChecks();
  const ids = checks.map(({ ruleId }) => ruleId);
  expect(checks.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.every((id) => /^([EA])-\d+(?:\.\d+)*$/.test(id))).toBe(true);
  expect(checks.every(({ run }) => typeof run === "function")).toBe(true);
});

test("bundled runtime does not import the private conventions repository", async () => {
  async function files(root) {
    const result = [];
    for (const entry of await (await import("node:fs/promises")).readdir(root, {
      withFileTypes: true,
    })) {
      const path = join(root, entry.name);
      if (entry.isDirectory()) result.push(...(await files(path)));
      else if (entry.isFile() && path.endsWith(".mjs")) result.push(path);
    }
    return result;
  }
  const references = [];
  for (const file of await files(join(process.cwd(), "src"))) {
    const content = await readFile(file, "utf8");
    if (/from\s+["'][^"']*eliware\/conventions|import\(\s*["'][^"']*eliware\/conventions/.test(content)) {
      references.push(relative(process.cwd(), file));
    }
  }
  expect(references).toEqual([]);
});
