import { expect, test } from "@jest/globals";
import { addShadowedJestDescribe } from "../../../../../../src/checks/application/E-0.1.4.1.2/collect/shadowed-jest-names/describe.mjs";

test("records a local describe binding and ignores unrelated names", () => {
  const shadowed = { describes: new Set() };
  addShadowedJestDescribe("describe", shadowed, { describes: new Set(["describe"]) });
  addShadowedJestDescribe("local", shadowed, { describes: new Set(["describe"]) });
  expect(shadowed.describes).toEqual(new Set(["describe"]));
});

test("accepts missing describe names", () => {
  const shadowed = { describes: new Set() };
  addShadowedJestDescribe("describe", shadowed, {});
  expect(shadowed.describes).toEqual(new Set());
});
