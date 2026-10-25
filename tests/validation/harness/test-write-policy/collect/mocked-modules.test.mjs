import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import {
  collectMockedModules,
  getRestrictedModuleName,
  isModuleMockedForLoad,
} from "../../../../../src/validation/harness/test-write-policy/collect/mocked-modules.mjs";

test("collects supported Jest module mocks", () => {
  const ast = parse(
    'jest.mock("node:fs"); jest["unstable_mockModule"]("node:os"); jest.doMock("node:http");',
  );
  expect([...collectMockedModules(ast)]).toEqual(["node:fs", "node:os", "node:http"]);
});

test("reads literal module names from dynamic imports and require calls", () => {
  const ast = parse('const fs = await import("node:fs"); const os = require("node:os");', {
    sourceType: "module",
  });
  const declarations = ast.program.body.filter((node) => node.type === "VariableDeclaration");
  expect(getRestrictedModuleName(declarations[0].declarations[0].init.argument)).toBe("node:fs");
  expect(getRestrictedModuleName(declarations[1].declarations[0].init)).toBe("node:os");
});

test("matches module aliases and only accepts mocks that apply before module loading", () => {
  const ast = parse(
    'jest.doMock("fs"); const first = require("node:fs"); const second = require("node:os");',
  );
  const [first, second] = ast.program.body.filter((node) => node.type === "VariableDeclaration");
  expect(isModuleMockedForLoad(ast, "node:fs", first.declarations[0].init)).toBe(true);
  expect(isModuleMockedForLoad(ast, "node:os", second.declarations[0].init)).toBe(false);
});
