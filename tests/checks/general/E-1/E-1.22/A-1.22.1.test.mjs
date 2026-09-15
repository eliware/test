import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { gitIgnores, run } from "../../../../../src/checks/general/E-1/E-1.22/A-1.22.1.mjs";

test("requires the deterministic repository ignore categories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-"));
  await writeFile(join(root, ".gitignore"), "node_modules/\n.git/\ncoverage/\ndist/\nbuild/\n.cache/\n.env*\n.vscode/\n.idea/\n");
  const checkIgnored = async (_root, path) => ["node_modules/eliware-test", ".git/config", "coverage/index.html", "dist/index.js", ".cache/test-state", ".env.local", ".env", ".vscode/settings.json", ".idea/workspace.xml"].includes(path);
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
  expect(await gitIgnores(root, "not-ignored.txt")).toBe(null);
  expect(await gitIgnores(process.cwd(), "node_modules/eliware-test")).toBe(true);
});

test("fails closed when Git returns an unexpected error", async () => {
  await expect(gitIgnores("C:/repo", "file", async () => { throw { code: 2 }; })).resolves.toBe(null);
  await expect(gitIgnores("C:/repo", "file", async () => { throw { code: 1 }; })).resolves.toBe(false);
});

test("reports an omitted dependency category", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-"));
  await writeFile(join(root, ".gitignore"), ".git\ncoverage\nbuild\nruntime\n.env\n.DS_Store\n");
  const checkIgnored = async (_root, path) => path !== "node_modules/eliware-test";
  await expect(run({ root, checkIgnored, trackedPaths: async () => [] })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("dependencies") }),
  );
});

test("reports a required path that is not effectively ignored", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-"));
  await writeFile(join(root, ".gitignore"), "node_modules/\n.git/\ncoverage/\ndist/\nbuild/\n.cache/\n.env*\n.vscode/\n.idea/\n");
  await expect(run({ root, checkIgnored: async (_root, path) => path !== "dist/index.js", trackedPaths: async () => [] })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("build output") }),
  );
});

test("fails closed when Git ignore inspection is unavailable", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-"));
  await writeFile(join(root, ".gitignore"), "node_modules/\n");
  await expect(run({ root, checkIgnored: async () => null, trackedPaths: async () => [] })).resolves.toEqual(expect.objectContaining({
    status: "fail",
    message: expect.stringContaining("Git ignore inspection was unavailable"),
  }));
});

test("rejects tracked prohibited paths even when the ignore rules are present", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-"));
  await writeFile(join(root, ".gitignore"), "node_modules/\n.git/\ncoverage/\ndist/\nbuild/\n.cache/\n.env*\n.vscode/\n.idea/\n");
  const checkIgnored = async () => true;
  await expect(run({ root, checkIgnored, trackedPaths: async () => ["README.md", ".env.example", ".env.local", ".git/config", "node_modules/pkg/index.mjs", ".idea/workspace.xml", "dist/index.js"] })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining(".env") }),
  );
});

test("fails closed when Git tracking information is unavailable", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-"));
  await writeFile(join(root, ".gitignore"), "node_modules/\n.git/\ncoverage/\ndist/\nbuild/\n.cache/\n.env*\n.vscode/\n.idea/\n");
  const checkIgnored = async () => true;
  await expect(run({ root, checkIgnored, trackedPaths: async () => null })).resolves.toEqual(expect.objectContaining({
    status: "fail",
    message: expect.stringContaining("Git tracked-file inspection was unavailable"),
  }));
});
