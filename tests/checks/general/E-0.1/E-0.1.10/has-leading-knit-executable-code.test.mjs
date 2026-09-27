import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { hasLeadingKnitExecutableCode } from "../../../../../src/checks/general/E-0.1/E-0.1.10/has-leading-knit-executable-code.mjs";

function hasLeadingCode(source) {
  const program = parse(source, {
    sourceType: "module",
    plugins: ["topLevelAwait"],
    allowUndeclaredExports: true,
  }).program;
  return hasLeadingKnitExecutableCode(program, source.indexOf("spawnSync("));
}

test("accepts declarations with inert initializers before command execution", () => {
  expect(
    hasLeadingCode(`
    import { spawnSync } from "node:child_process";
    const value = { nested: 1 };
    export const exported = 1;
    const local = 1;
    export { local };
    function validate() {}
    export default function setup() {}
    class Setup { static value = true; }
    class Methods { method() {} static configured() {} }
    spawnSync("npm", ["test"]);
  `),
  ).toBe(false);
});

test("detects executable statements and initializers before the first command", () => {
  for (const statement of [
    'console.log("before");',
    "const setup = initialize();",
    "process.env.X;",
    'if (enabled) { initialize("before"); }',
  ]) {
    expect(hasLeadingCode(`${statement} spawnSync("npm", ["test"]);`)).toBe(true);
  }
});

test("detects class initialization and export indirection with executable effects", () => {
  for (const declaration of [
    "class Setup { static { initialize(); } }",
    "class Setup { static value = initialize(); }",
    "class Setup { [initialize()]() {} }",
    "class Setup extends initialize() {}",
    "export { value } from 'external-package';",
  ]) {
    expect(hasLeadingCode(`${declaration} spawnSync("npm", ["test"]);`)).toBe(true);
  }
});

test("checks only statements before the first command", () => {
  const program = parse(
    'import { spawnSync } from "node:child_process"; spawnSync("npm", ["test"]); console.log("after");',
    { sourceType: "module" },
  ).program;
  const source =
    'import { spawnSync } from "node:child_process"; spawnSync("npm", ["test"]); console.log("after");';
  expect(hasLeadingKnitExecutableCode(program, source.indexOf("spawnSync("))).toBe(false);
});
