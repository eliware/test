import { expect, test } from "@jest/globals";
import { collectLauncherAliases } from "../../../../../../src/checks/application/E-0.1.4.1.3/analyze/collect/launcher-aliases.mjs";

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
});

test("returns built-in aliases when the syntax tree is missing", () => {
  expect(collectLauncherAliases(null)).toEqual(
    new Set(["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"]),
  );
});
