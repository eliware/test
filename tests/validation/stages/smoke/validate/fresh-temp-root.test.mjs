import { expect, test } from "@jest/globals";
import { isFreshSmokeTempChild } from "../../../../../src/validation/stages/smoke/validate/fresh-temp-root.mjs";

test("accepts only a prefixed direct child of the smoke root", () => {
  expect(isFreshSmokeTempChild("C:/repo", "C:/repo/.eliware-tarball-smoke-1")).toBe(true);
  expect(isFreshSmokeTempChild("C:/repo", "C:/repo/other-1")).toBe(false);
});

test.each([
  "C:/repo",
  "C:/outside/.eliware-tarball-smoke-1",
  "C:/repo/nested/.eliware-tarball-smoke-1",
])("rejects a path that is not a direct child: %s", (path) => {
  expect(isFreshSmokeTempChild("C:/repo", path)).toBe(false);
});
