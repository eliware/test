import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverCheckTree } from "../../src/orchestrators/discover-check-tree.mjs";

test("discovers nested directive modules and records their parent", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-check-tree-"));
  await mkdir(join(root, "E-1"));
  await writeFile(join(root, "E-2.mjs"), 'export const ruleId = "E-2"; export function run() {}');
  await writeFile(join(root, "E-1", "A-1.1.mjs"), 'export const ruleId = "A-1.1"; export function run() {}');
  const checks = await discoverCheckTree(root, (url) => import(url));
  expect(checks.map(({ ruleId, parentRuleId }) => ({ ruleId, parentRuleId }))).toEqual([
    { ruleId: "A-1.1", parentRuleId: "E-1" },
    { ruleId: "E-2", parentRuleId: null },
  ]);
  await rm(root, { recursive: true, force: true });
});

test("discovers a root-level module with default parent handling", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-check-tree-root-"));
  await writeFile(join(root, "E-3.mjs"), 'export const ruleId = "E-3"; export function run() {}');
  const checks = await discoverCheckTree(root, (url) => import(url));
  expect(checks[0]).toMatchObject({ ruleId: "E-3", parentRuleId: null });
  await rm(root, { recursive: true, force: true });
});

test("ignores unrelated entries and rejects invalid modules", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-check-tree-invalid-"));
  await writeFile(join(root, "README.md"), "ignored");
  await writeFile(join(root, "E-2.mjs"), 'export const ruleId = "wrong"; export function run() {}');
  await expect(discoverCheckTree(root, (url) => import(url))).rejects.toThrow("Invalid check module");
  await rm(root, { recursive: true, force: true });
});

test("handles explicit directory and non-rule entry shapes", async () => {
  let depth = 0;
  const checks = await discoverCheckTree("C:/root", async (url) => ({ ruleId: url.href.includes("E-2") ? "E-2" : "E-1", run() {} }), null, async () => {
    depth += 1;
    if (depth === 1) return [
      { name: "E-1", isDirectory: () => true, isFile: () => false },
      { name: "misc", isDirectory: () => true, isFile: () => false },
    ];
    return [{ name: "README.md", isDirectory: () => false, isFile: () => true }, { name: `${depth === 2 ? "E-1" : "E-2"}.mjs`, isDirectory: () => false, isFile: () => true }];
  });
  expect(checks).toHaveLength(2);
  expect(checks.find(({ ruleId }) => ruleId === "E-2").parentRuleId).toBeNull();
});
