import { expect, test } from "@jest/globals";
import { isPureBarrelSource } from "../../../../../src/checks/general/E-1/E-1.20/parse-pure-barrel.mjs";

test("classifies export-only modules", () => {
  expect(isPureBarrelSource('export * from "./value.mjs";')).toBe(true);
  expect(isPureBarrelSource('import "./side-effect.mjs";')).toBe(false);
  expect(isPureBarrelSource("const value = 1; export { value };" )).toBe(false);
});
