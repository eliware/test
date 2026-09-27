import { expect, test } from "@jest/globals";
import { hasExplicitIgnoreRule } from "../../../../../src/checks/general/E-0.1/E-0.1.22/git-ignore-policy.mjs";

test("classifies explicit ignore rules", () => {
  expect(hasExplicitIgnoreRule("node_modules/\n.env*\n", "node_modules/pkg")).toBe(true);
  expect(hasExplicitIgnoreRule("node_modules/\n", ".env.local")).toBe(false);
});

test("recognizes root ignore rules written with Windows path separators", () => {
  expect(hasExplicitIgnoreRule("node_modules\\\r\n", "node_modules/eliware-test")).toBe(true);
  expect(hasExplicitIgnoreRule("\\coverage\\\n", "coverage/index.html")).toBe(true);
  expect(hasExplicitIgnoreRule("dist\\\n", "dist/index.js")).toBe(true);
  expect(hasExplicitIgnoreRule("node_modules\\\n", ".git/config")).toBe(false);
});
