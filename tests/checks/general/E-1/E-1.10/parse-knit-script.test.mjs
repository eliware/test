import { expect, test } from "@jest/globals";
import {
  commandTokens,
  parseKnitScript,
} from "../../../../../src/checks/general/E-1/E-1.10/parse-knit-script.mjs";

test("parses static child-process commands and loop bindings", () => {
  const parsed = parseKnitScript(`
    import { spawnSync } from "node:child_process";
    for (const [command, args] of [["git", ["pull", "--ff-only", "origin", "main"]], ["npm", ["ci"]]]) {
      spawnSync(command, args, { shell: false });
    }
  `);
  expect(parsed.error).toBeUndefined();
  expect(parsed.calls.map(commandTokens)).toEqual([
    ["git", "pull", "--ff-only", "origin", "main"],
    ["npm", "ci"],
  ]);
});

test("reports dynamic subprocess commands as uninspectable", () => {
  const parsed = parseKnitScript(
    `import { spawnSync } from "node:child_process"; spawnSync(command, args);`,
  );
  expect(parsed.calls).toHaveLength(1);
  expect(commandTokens(parsed.calls[0])).toBeNull();
});

test("parses namespace child-process calls", () => {
  const parsed = parseKnitScript(`
    import * as childProcess from "node:child_process";
    childProcess.execFileSync("npm", ["test"]);
  `);
  expect(parsed.calls.map(commandTokens)).toEqual([["npm", "test"]]);
});

test("rejects malformed JavaScript", () => {
  expect(parseKnitScript("import { spawnSync } from")).toEqual(
    expect.objectContaining({ calls: [], error: expect.any(String) }),
  );
});

test("marks filesystem, network, and dynamic execution as unsupported", () => {
  const parsed = parseKnitScript('import { readFile } from "node:fs/promises"; import { request } from "node:https"; readFile("x"); request("x"); eval("x");');
  expect(parsed.unsupported.length).toBeGreaterThanOrEqual(3);
});

test("rejects side-effect imports from arbitrary modules", () => {
  const parsed = parseKnitScript('import "custom-side-effect"; import value from "unknown-package";');
  expect(parsed.calls).toEqual([]);
  expect(parsed.unsupported).toHaveLength(2);
});

test("does not allow command wrappers to hide side effects", () => {
  const parsed = parseKnitScript('import { spawnSync } from "node:child_process"; const run = (args) => spawnSync(...args); run([["npm", ["test"]]]);');
  expect(parsed.unsupported.length).toBeGreaterThan(0);
});

test("handles scripts without commands and non-string command tokens", () => {
  expect(parseKnitScript("const value = 1;")).toEqual({
    calls: [],
    unsupported: [],
    leadingExecutable: false,
  });
  expect(commandTokens({ command: "npm", args: [1] })).toBeNull();
  expect(commandTokens({ command: 1, args: [] })).toBeNull();
  expect(commandTokens({ command: "npm", args: "test" })).toBeNull();
});
