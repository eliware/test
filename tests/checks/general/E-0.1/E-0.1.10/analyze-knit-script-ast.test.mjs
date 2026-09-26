import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { analyzeKnitScriptAst } from "../../../../../src/checks/general/E-0.1/E-0.1.10/analyze-knit-script-ast.mjs";

function analyze(source) {
  return analyzeKnitScriptAst(
    parse(source, {
      sourceType: "module",
      plugins: ["importAttributes", "topLevelAwait"],
      allowUndeclaredExports: true,
    }),
  );
}

test("collects ordered static subprocess commands and detects leading executable code", () => {
  const result = analyze(`
    import { spawnSync } from "node:child_process";
    const command = "npm";
    spawnSync(command, ["test"]);
  `);
  expect(result.calls.map(({ command, args }) => [command, ...args])).toEqual([["npm", "test"]]);
  expect(result.unsupported).toEqual([]);
  expect(result.leadingExecutable).toBe(false);
  expect(
    analyze(
      'console.log("before"); import { spawnSync } from "node:child_process"; spawnSync("npm", ["test"]);',
    ).leadingExecutable,
  ).toBe(true);
});

test("marks unsupported imports and dynamic operations", () => {
  const result = analyze(`
    import { spawnSync } from "node:child_process";
    import { readFile } from "node:fs/promises";
    import "custom-side-effect";
    readFile("file");
    spawnSync(command, args);
  `);
  expect(result.calls).toHaveLength(1);
  expect(result.calls[0]).toEqual(
    expect.objectContaining({ kind: "spawnSync", command: undefined }),
  );
  expect(result.unsupported.length).toBeGreaterThanOrEqual(3);
});

test("detects executable initializers and statements before the required command sequence", () => {
  const prefix = 'import { spawnSync } from "node:child_process";';
  for (const statement of [
    "const setup = initialize();",
    "class Setup { static value = initialize(); }",
    "process.env.X;",
    'if (enabled) { initialize("before"); }',
  ]) {
    expect(
      analyze(`${prefix} ${statement} spawnSync("git", ["pull", "--ff-only", "origin", "main"]);`)
        .leadingExecutable,
    ).toBe(true);
  }
  for (const declaration of [
    "class Setup { static { initialize(); } }",
    "class Setup { static value = initialize(); }",
    "class Setup { [initialize()]() {} }",
    "class Setup extends initialize() {}",
  ]) {
    expect(
      analyze(`${prefix} ${declaration} spawnSync("git", ["pull", "--ff-only", "origin", "main"]);`)
        .leadingExecutable,
    ).toBe(true);
  }
  expect(
    analyze(`${prefix} class Setup { static value = true; } spawnSync("git", ["pull"]);`)
      .leadingExecutable,
  ).toBe(false);
});

test("handles inert exports, rejects re-export execution, and sorts command calls", () => {
  const commands =
    'import { spawnSync } from "node:child_process"; spawnSync("git", ["pull"]); spawnSync("npm", ["ci"]);';
  const inert = analyze(`export default function setup() {} ${commands}`);
  expect(inert.leadingExecutable).toBe(false);
  expect(inert.calls.map(({ command }) => command)).toEqual(["git", "npm"]);

  const reExport = analyze(`export { value } from "external-package"; ${commands}`);
  expect(reExport.unsupported.length).toBeGreaterThan(0);
  expect(reExport.leadingExecutable).toBe(true);

  const exportList = analyze(`export { value }; ${commands}`);
  expect(exportList.unsupported).toEqual([]);
  expect(exportList.leadingExecutable).toBe(false);

  const inertDeclaration = analyze(`export const value = { nested: 1 }; ${commands}`);
  expect(inertDeclaration.leadingExecutable).toBe(false);

  const executableExport = analyze(`export const setup = initialize(); ${commands}`);
  expect(executableExport.leadingExecutable).toBe(true);
});

test("returns no commands for an empty script", () => {
  expect(analyze("")).toEqual({ calls: [], unsupported: [], leadingExecutable: false });
});
