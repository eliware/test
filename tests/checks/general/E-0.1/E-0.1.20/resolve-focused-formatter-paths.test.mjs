import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveFocusedFormatterPaths } from "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-focused-formatter-paths.mjs";

test("accepts existing maintained files and rejects invalid focused scopes", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-paths-"));
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "example.mjs"), "export {};\n");
  try {
    await expect(resolveFocusedFormatterPaths(root, { paths: ["src/example.mjs"] })).resolves.toEqual(["src/example.mjs"]);
    for (const focusedScope of [null, {}, { paths: null }, { paths: [] }, ...["", "src/../package.json", "src/./example.mjs", "docs/example.md", 7].map((path) => ({ paths: [path] }))]) {
      await expect(resolveFocusedFormatterPaths(root, focusedScope)).resolves.toBeNull();
    }
    await expect(resolveFocusedFormatterPaths(root, { paths: ["src/missing.mjs"] })).resolves.toBeNull();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects directories and symlinks that resolve outside the repository", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-paths-boundary-"));
  const outside = await mkdtemp(join(tmpdir(), "eliware-focused-paths-outside-"));
  await mkdir(join(root, "src", "directory"), { recursive: true });
  await writeFile(join(outside, "escape.mjs"), "export {};\n");
  await symlink(outside, join(root, "src", "linked"), process.platform === "win32" ? "junction" : "dir");
  try {
    await expect(resolveFocusedFormatterPaths(root, { paths: ["src/directory"] })).resolves.toBeNull();
    await expect(resolveFocusedFormatterPaths(root, { paths: ["src/linked/escape.mjs"] })).resolves.toBeNull();
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
