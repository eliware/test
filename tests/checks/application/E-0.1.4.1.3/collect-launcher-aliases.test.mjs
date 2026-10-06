import { expect, test } from "@jest/globals";
import {
  collectLauncherAliases,
  isLauncher,
} from "../../../../src/checks/application/E-0.1.4.1.3/collect-launcher-aliases.mjs";

test("collects imported and chained child-process launcher aliases", () => {
  const ast = {
    type: "Program",
    body: [
      {
        type: "ImportDeclaration",
        source: { value: "node:child_process" },
        specifiers: [
          { type: "ImportSpecifier", imported: { name: "spawn" }, local: { name: "launch" } },
        ],
      },
      {
        type: "VariableDeclarator",
        id: { type: "Identifier", name: "run" },
        init: { type: "Identifier", name: "launch" },
      },
    ],
  };
  const aliases = collectLauncherAliases(ast);
  expect(aliases.has("launch")).toBe(true);
  expect(aliases.has("run")).toBe(true);
  expect(isLauncher({ type: "Identifier", name: "run" }, aliases)).toBe(true);
});

test("recognizes launcher member aliases and rejects other callees", () => {
  const aliases = collectLauncherAliases({ type: "Program", body: [null] });
  expect(isLauncher({ type: "MemberExpression", property: { name: "spawnSync" } }, aliases)).toBe(
    true,
  );
  expect(isLauncher({ type: "Identifier", name: "custom" }, aliases)).toBe(false);
  expect(
    isLauncher({ type: "MemberExpression", computed: true, property: { value: "fork" } }, aliases),
  ).toBe(true);
});
