import { expect, test } from "@jest/globals";
import { join, resolve } from "node:path";
import { resolvePackExecutable } from "../../../../src/validation/stages/pack/resolve-pack-executable.mjs";

test("resolves a relative npm_execpath from the package root", () => {
  const root = resolve("/repo");
  expect(
    resolvePackExecutable({ npm_execpath: "npm-cli.js" }, "linux", process.execPath, root),
  ).toEqual([process.execPath, [join(root, "npm-cli.js")]]);
});

test("uses the platform fallback when npm_execpath cannot be resolved", () => {
  expect(() => resolvePackExecutable({ PATH: "" }, "win32", "node.exe")).toThrow(
    "Cannot resolve the npm CLI on Windows",
  );
  expect(resolvePackExecutable({}, "linux", "node")).toEqual(["npm", []]);
  expect(resolvePackExecutable()).toHaveLength(2);
});
