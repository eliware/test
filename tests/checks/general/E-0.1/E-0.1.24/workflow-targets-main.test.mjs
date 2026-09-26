import { expect, test } from "@jest/globals";
import { pullRequestTargetsMain, pushTargetsMain } from "../../../../../src/checks/general/E-0.1/E-0.1.24/workflow-targets-main.mjs";

test("evaluates push branch shapes and main inclusion", () => {
  expect(pushTargetsMain(["main"])).toBe(true);
  expect(pushTargetsMain(["main*"])).toBe(true);
  expect(pushTargetsMain(["*", "!main*"])).toBe(false);
  expect(pushTargetsMain(["*", "!main*", "main"])).toBe(true);
  expect(pushTargetsMain(["dev"])).toBe(false);
  for (const push of [undefined, null, false]) expect(pushTargetsMain(push)).toBe(false);
  expect(pushTargetsMain(true)).toBe(true);
  expect(pushTargetsMain({})).toBe(true);
  expect(pushTargetsMain({ branches: [] })).toBe(true);
  expect(pushTargetsMain({ branches: ["*", null, "!release/*"] })).toBe(false);
  expect(pushTargetsMain({ branches: ["main", "!main"] })).toBe(false);
  expect(pushTargetsMain({ branches: ["*", "!main", "main"] })).toBe(true);
  expect(pushTargetsMain({ branches: ["main"], "branches-ignore": ["m*"] })).toBe(false);
  expect(pushTargetsMain({ branches: ["main"], "branches-ignore": [null] })).toBe(false);
});

test("evaluates pull-request branch shapes and main exclusions", () => {
  for (const event of [undefined, null, false]) expect(pullRequestTargetsMain(event)).toBe(false);
  expect(pullRequestTargetsMain("pull_request")).toBe(true);
  expect(pullRequestTargetsMain([])).toBe(true);
  expect(pullRequestTargetsMain({})).toBe(true);
  expect(pullRequestTargetsMain({ branches: ["!main"] })).toBe(false);
  expect(pullRequestTargetsMain({ branches: ["*", "!main", "main"] })).toBe(true);
  expect(pullRequestTargetsMain({ "branches-ignore": ["main"] })).toBe(false);
  expect(pullRequestTargetsMain({ "branches-ignore": ["release/*", null] })).toBe(false);
  expect(pullRequestTargetsMain({ branches: ["main", 42] })).toBe(false);
});

test("matches overlapping GitHub globs in order", () => {
  expect(pushTargetsMain({ branches: ["**/main", "!**/main"] })).toBe(false);
  expect(pushTargetsMain({ branches: ["**", "!**/main", "main"] })).toBe(true);
  expect(pushTargetsMain({ branches: ["main", "release/*"] })).toBe(true);
});
