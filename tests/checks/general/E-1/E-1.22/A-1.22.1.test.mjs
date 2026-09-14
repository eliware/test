import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { gitIgnores, run } from "../../../../../src/checks/general/E-1/E-1.22/A-1.22.1.mjs";

test("requires the deterministic repository ignore categories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-"));
  await writeFile(join(root, ".gitignore"), "node_modules/\n.git/\ncoverage/\ndist/\n.cache/\n.env*\n.vscode/\n");
  const checkIgnored = async (_root, path) => ["node_modules/eliware-test", ".git/config", "coverage/index.html", "dist/index.js", ".cache/test-state", ".env.local", ".vscode/settings.json"].includes(path);
  expect((await run({ root, checkIgnored, trackedPaths: async () => [] })).status).toBe("pass");
  await writeFile(join(root, ".gitignore"), "node_modules/\n");
  expect((await run({ root, checkIgnored: async (_root, path) => path === "node_modules/eliware-test", trackedPaths: async () => [] })).status).toBe("fail");
});

test("fails when .gitignore is absent", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.22.1",
    status: "fail",
    message: ".gitignore is required.",
  });
});

test("uses Git ignore machinery and handles an unignored path", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-"));
  await writeFile(join(root, ".gitignore"), "node_modules/\n");
  expect(await gitIgnores(root, "not-ignored.txt")).toBe(false);
  expect(await gitIgnores(process.cwd(), "node_modules/eliware-test")).toBe(true);
});

test("reports an omitted dependency category", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-"));
  await writeFile(join(root, ".gitignore"), ".git\ncoverage\nbuild\nruntime\n.env\n.DS_Store\n");
  const checkIgnored = async (_root, path) => path !== "node_modules/eliware-test";
  await expect(run({ root, checkIgnored, trackedPaths: async () => [] })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("dependencies") }),
  );
});

test("rejects tracked prohibited paths even when the ignore rules are present", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-"));
  await writeFile(join(root, ".gitignore"), "node_modules/\n.git/\ncoverage/\ndist/\n.cache/\n.env*\n.vscode/\n");
  const checkIgnored = async () => true;
  await expect(run({ root, checkIgnored, trackedPaths: async () => ["README.md", ".env.example", ".env.local", "dist/index.js"] })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining(".env") }),
  );
});

test("continues when Git tracking information is unavailable", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-"));
  await writeFile(join(root, ".gitignore"), "node_modules/\n.git/\ncoverage/\ndist/\n.cache/\n.env*\n.vscode/\n");
  const checkIgnored = async () => true;
  expect((await run({ root, checkIgnored, trackedPaths: async () => null })).status).toBe("pass");
});
