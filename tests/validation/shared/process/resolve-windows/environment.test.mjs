import { expect, test } from "@jest/globals";
import resolveWindowsEnvironment from "../../../../../src/validation/shared/process/resolve-windows/environment.mjs";
test("merges environment keys without changing their case-insensitive identity", () => {
  expect(
    resolveWindowsEnvironment({ PATH: "C:/new", Custom: "value" }, { Path: "C:/old" }),
  ).toEqual({
    PATH: "C:/new",
    Custom: "value",
  });
});
test("adds new keys while preserving the base environment", () => {
  expect(resolveWindowsEnvironment({ Added: "yes" }, { Existing: "kept" })).toEqual({
    Existing: "kept",
    Added: "yes",
  });
});
