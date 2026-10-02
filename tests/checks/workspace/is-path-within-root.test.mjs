import { expect, test } from "@jest/globals";
import { win32 } from "node:path";
import { isPathWithinRoot } from "../../../src/checks/workspace/is-path-within-root.mjs";

test("accepts the repository root and paths below it", () => {
  expect(isPathWithinRoot("/repo", "/repo")).toBe(true);
  expect(isPathWithinRoot("/repo", "/repo/runbooks/deploy.json")).toBe(true);
});

test("rejects parent traversal and a different Windows volume", () => {
  expect(isPathWithinRoot("/repo", "/outside/runbook.json")).toBe(false);
  expect(isPathWithinRoot("C:\\repo", "D:\\runbooks\\deploy.json", win32)).toBe(false);
});
