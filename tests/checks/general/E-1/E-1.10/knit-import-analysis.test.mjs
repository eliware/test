import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectImports } from "../../../../../src/checks/general/E-1/E-1.10/knit-import-analysis.mjs";

test("collects process and side-effect import bindings", () => {
  const imports = collectImports(parse(
    'import { spawn } from "node:child_process"; import * as fs from "node:fs"; import cp from "node:child_process";',
    { sourceType: "module" },
  ).program);
  expect(imports.names.get("spawn")).toBe("spawn");
  expect(imports.namespaces).toEqual(new Set());
  expect(imports.sideEffectNamespaces.has("fs")).toBe(true);
  expect(imports.sideEffectNamespaces.has("cp")).toBe(true);
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
  expect(imports.sideEffectNamespaces.has("cp")).toBe(true);
  expect(imports.sideEffectNamespaces.has("net")).toBe(true);
  expect(imports.sideEffectModules).toBeUndefined();
});
