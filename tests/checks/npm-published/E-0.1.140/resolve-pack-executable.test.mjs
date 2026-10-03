import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { resolvePackExecutable } from "../../../../src/checks/npm-published/E-0.1.140/resolve-pack-executable.mjs";

test("resolves a relative npm_execpath from the package root", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-pack-npm-path-"));
  const npmCli = join(root, "npm-cli.js");
  await mkdir(root, { recursive: true });
  await writeFile(npmCli, "");
  try {
    expect(
      resolvePackExecutable({ npm_execpath: "npm-cli.js" }, "linux", process.execPath, root),
    ).toEqual([process.execPath, [npmCli]]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uses the platform fallback when npm_execpath cannot be resolved", () => {
  expect(() => resolvePackExecutable({ PATH: "" }, "win32", "node.exe")).toThrow(
    "Unable to resolve the npm CLI on Windows",
  );
  expect(resolvePackExecutable({}, "linux", "node")).toEqual(["npm", []]);
  expect(resolvePackExecutable()).toHaveLength(2);
});
