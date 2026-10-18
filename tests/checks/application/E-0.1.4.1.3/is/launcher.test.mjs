import { expect, test } from "@jest/globals";
import { isLauncher } from "../../../../../src/checks/application/E-0.1.4.1.3/is/launcher.mjs";

const names = new Set(["spawn", "spawnSync", "fork"]);

test("matches launcher names and member properties", () => {
  expect(isLauncher({ type: "Identifier", name: "spawn" }, names)).toBe(true);
  expect(isLauncher({ type: "MemberExpression", property: { name: "spawnSync" } }, names)).toBe(
    true,
  );
  expect(
    isLauncher({ type: "MemberExpression", computed: true, property: { value: "fork" } }, names),
  ).toBe(true);
});

test("rejects other or incomplete callees", () => {
  expect(isLauncher({ type: "Identifier", name: "custom" }, names)).toBe(false);
  expect(isLauncher({ type: "MemberExpression", property: { name: "custom" } }, names)).toBe(false);
  expect(isLauncher(undefined, names)).toBe(false);
  expect(isLauncher({ type: "MemberExpression" }, names)).toBe(false);
});
