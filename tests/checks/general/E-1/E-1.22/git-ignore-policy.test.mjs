import { expect, test } from "@jest/globals";
import {
  hasExplicitIgnoreRule,
  prohibitedTrackedPath,
} from "../../../../../src/checks/general/E-1/E-1.22/git-ignore-policy.mjs";

test("classifies explicit ignore rules and prohibited tracked paths", () => {
  expect(hasExplicitIgnoreRule("node_modules/\n.env*\n", "node_modules/pkg")).toBe(true);
  expect(hasExplicitIgnoreRule("node_modules/\n", ".env.local")).toBe(false);
  expect(prohibitedTrackedPath("src\\.env.local")).toBe(true);
  expect(prohibitedTrackedPath("src/.env.example")).toBe(false);
  expect(prohibitedTrackedPath("src/certificate.pem")).toBe(true);
});

test("recognizes root ignore rules written with Windows path separators", () => {
  expect(hasExplicitIgnoreRule("node_modules\\\r\n", "node_modules/eliware-test")).toBe(true);
  expect(hasExplicitIgnoreRule("\\coverage\\\n", "coverage/index.html")).toBe(true);
  expect(hasExplicitIgnoreRule("dist\\\n", "dist/index.js")).toBe(true);
  expect(hasExplicitIgnoreRule("node_modules\\\n", ".git/config")).toBe(false);
});
