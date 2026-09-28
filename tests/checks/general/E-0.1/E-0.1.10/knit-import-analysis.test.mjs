import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectImports } from "../../../../../src/checks/general/E-0.1/E-0.1.10/knit-import-analysis.mjs";

test("collects process and side-effect import bindings", () => {
  const imports = collectImports(
    parse(
      'const value = 1; import { spawn } from "node:child_process"; import * as fs from "node:fs"; import cp from "node:child_process";',
      { sourceType: "module" },
    ).program,
  );
  expect(imports.names.get("spawn")).toBe("spawn");
  expect(imports.namespaces).toEqual(new Set());
  expect(imports.sideEffectNamespaces.has("fs")).toBe(true);
  expect(imports.sideEffectNamespaces.has("cp")).toBe(false);
  expect(imports.unsupported).toHaveLength(1);
});

test("collects named, default, namespace, and side-effect imports", () => {
  const imports = collectImports(
    parse(
      'import { exec, spawn } from "node:child_process"; import cp from "node:child_process"; import * as child from "node:child_process"; import { rm } from "node:fs"; import * as net from "node:net"; import { custom } from "custom"; import "node:fs";',
      { sourceType: "module" },
    ).program,
  );
  expect(imports.names.get("exec")).toBe("exec");
  expect(imports.names.get("spawn")).toBe("spawn");
  expect(imports.namespaces.has("child")).toBe(true);
  expect(imports.sideEffectNamespaces.has("cp")).toBe(false);
  expect(imports.unsupported).toHaveLength(1);
  expect(imports.sideEffectNamespaces.has("net")).toBe(true);
  expect(imports.sideEffectModules).toBeUndefined();
});

test("preserves canonical aliases and flags non-process child-process imports", () => {
  const imports = collectImports(
    parse('import { execSync as runCommand, fork } from "node:child_process";', {
      sourceType: "module",
    }).program,
  );
  expect(imports.names.get("runCommand")).toBe("execSync");
  expect(imports.names.has("fork")).toBe(false);
  expect(imports.unsupported).toHaveLength(1);
});

test("recognizes both Node child-process module specifiers", () => {
  const imports = collectImports(
    parse('import { spawn as run } from "child_process"; import * as child from "child_process";', {
      sourceType: "module",
    }).program,
  );
  expect(imports.names.get("run")).toBe("spawn");
  expect(imports.namespaces.has("child")).toBe(true);
  expect(imports.unsupported).toHaveLength(0);
});

test("flags side-effect imports and re-exports of child-process APIs", () => {
  for (const source of [
    'import "node:child_process";',
    'export { spawn as run } from "child_process";',
  ]) {
    const imports = collectImports(parse(source, { sourceType: "module" }).program);
    expect(imports.unsupported).toHaveLength(1);
  }
});
