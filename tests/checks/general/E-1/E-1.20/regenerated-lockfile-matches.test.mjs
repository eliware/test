import { expect, test } from "@jest/globals";
import { regeneratedLockfileMatches } from "../../../../../src/checks/general/E-1/E-1.20/regenerated-lockfile-matches.mjs";
import { selectNpmCommand as npmCommand } from "../../../../../src/checks/general/E-1/E-1.20/select-npm-command.mjs";
import { normalizeLockfile as normalize } from "../../../../../src/checks/general/E-1/E-1.20/normalize-lockfile.mjs";
import { runNpmProcess as runNpm } from "../../../../../src/checks/general/E-1/E-1.20/run-npm-process.mjs";

test("exports the lockfile regeneration contract", () => {
  expect(regeneratedLockfileMatches).toEqual(expect.any(Function));
});

test("selects npm command variants and normalizes nested values", () => {
  expect(npmCommand()).toEqual(expect.any(Array));
  expect(npmCommand({ env: { npm_execpath: "/npm-cli.js" }, platform: "linux", execPath: "/node" })).toEqual([
    "/node", ["/npm-cli.js"],
  ]);
  expect(npmCommand({ env: {}, platform: "win32", execPath: "C:\\node.exe" })[0]).toBe("C:\\node.exe");
  expect(npmCommand({ env: {}, platform: "linux", execPath: "/node" })).toEqual(["npm", []]);
  expect(normalize({ b: [2, { z: 1, a: 0 }], a: 1 })).toEqual({ a: 1, b: [2, { a: 0, z: 1 }] });
  expect(normalize("value")).toBe("value");
  expect(normalize(null)).toBeNull();
  expect(normalize([1, null])).toEqual([1, null]);
});

test("runs the isolated regeneration comparison with injected process seams", async () => {
  const files = new Map();
  const packageJson = { name: "fixture", version: "1.0.0" };
  const lockfile = { lockfileVersion: 3, packages: { "": { name: "fixture", version: "1.0.0" } } };
  const createTemporary = async () => "C:\\temp-lock";
  const write = async (path, value) => files.set(path, value);
  const read = async (path) => files.get(path);
  const runCommand = async () => {
    files.set("C:\\temp-lock\\package-lock.json", JSON.stringify(lockfile));
    return { code: 0, stderr: "" };
  };
  await expect(regeneratedLockfileMatches(packageJson, lockfile, {
    createTemporary, write, read, runCommand, removeTemporary: async () => {}, getNpmCommand: () => ["npm", []],
  })).resolves.toBe(true);
  await expect(regeneratedLockfileMatches(packageJson, lockfile, {
    createTemporary, write, read: async () => "not json", runCommand: async () => ({ code: 0, stderr: "" }), removeTemporary: async () => {}, getNpmCommand: () => ["npm", []],
  })).rejects.toThrow();
});

test("cleans up temporary workspace after regeneration failure", async () => {
  const removed = [];
  await expect(regeneratedLockfileMatches({}, {}, {
    createTemporary: async () => "C:\\temp-lock",
    write: async () => {},
    runCommand: async () => ({ code: 1, stderr: "offline" }),
    removeTemporary: async (path) => removed.push(path),
    getNpmCommand: () => ["npm", []],
  })).rejects.toThrow("offline");
  expect(removed).toEqual(["C:\\temp-lock"]);
});

test("uses default temporary-file and npm-command dependencies", async () => {
  await expect(
    regeneratedLockfileMatches({}, {}, {
      getNpmCommand: () => [process.execPath, ["-e", "process.exit(1)"]],
    }),
  ).rejects.toThrow("npm could not regenerate package-lock.json");
});

test("executes the default npm command seam", async () => {
  const previous = process.env.npm_execpath;
  process.env.npm_execpath = process.execPath;
  try {
    await expect(regeneratedLockfileMatches({}, {})).rejects.toThrow("npm could not regenerate package-lock.json");
  } finally {
    if (previous === undefined) delete process.env.npm_execpath;
    else process.env.npm_execpath = previous;
  }
});

test("captures spawned stderr and process errors", async () => {
  await expect(runNpm(process.execPath, ["-e", "process.stderr.write('diagnostic')"], process.cwd())).resolves.toEqual(
    expect.objectContaining({ code: 0, stderr: "diagnostic" }),
  );
  await expect(runNpm("C:\\missing-executable", [], process.cwd())).rejects.toBeTruthy();
});
