import { parse } from "@babel/parser";
import { expect, test } from "@jest/globals";
import { hasUnsupportedKnitChildProcessCall } from "../../../../../src/checks/general/E-0.1/E-0.1.10/find-unsupported-knit-child-process-call.mjs";

function parsed(source) {
  return parse(source, { sourceType: "module" }).program;
}

function directCall(program) {
  return program.body[1].expression;
}

test("allows only analyzed top-level child-process calls", () => {
  const program = parsed(
    'import * as child from "node:child_process"; child.execSync("npm", ["test"]);',
  );
  const call = directCall(program);

  expect(hasUnsupportedKnitChildProcessCall(program, [{ start: call.start }])).toBe(false);
  expect(hasUnsupportedKnitChildProcessCall(program)).toBe(true);
});

test("rejects child-process calls nested in helper functions even when analyzed", () => {
  const program = parsed(
    'import * as child from "node:child_process"; function helper() { child.execSync("node", ["-e", "work"]); }',
  );
  const call = program.body[1].body.body[0].expression;

  expect(hasUnsupportedKnitChildProcessCall(program, [{ start: call.start }])).toBe(true);
});

test("recognizes named-import aliases as child-process calls", () => {
  const program = parsed(
    'import { execSync as run } from "node:child_process"; run("npm", ["test"]);',
  );
  const call = directCall(program);

  expect(hasUnsupportedKnitChildProcessCall(program, [{ start: call.start }])).toBe(false);
  expect(hasUnsupportedKnitChildProcessCall(program)).toBe(true);
});

test("safely ignores missing, primitive, and previously visited AST nodes", () => {
  const program = parsed("const value = 1;");
  program.extraChildren = [null, "not-an-AST-node"];
  expect(hasUnsupportedKnitChildProcessCall(program)).toBe(false);

  const cyclic = { type: "Program", body: [] };
  cyclic.self = cyclic;
  expect(hasUnsupportedKnitChildProcessCall(cyclic)).toBe(false);
});
