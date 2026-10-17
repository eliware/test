import { expect, test } from "@jest/globals";
import { findProtectedNegations } from "../../../../../../src/checks/general/E-0.1.0.1.8/validate/ignore-patterns/protected-negations.mjs";

const requiredRules = [
  "node_modules/",
  ".git/",
  "coverage/",
  "dist/",
  "build/",
  "generated/",
  "artifacts/",
  "test-results/",
  ".DS_Store",
  "Thumbs.db",
];

test("finds later negations that restore protected directories and files", () => {
  expect(
    findProtectedNegations([
      ...requiredRules,
      "!node_modules/",
      "!nested/coverage/",
      "!src/**/dist/**",
      "!**/.DS_Store",
      "!nested/deep/Thumbs.db",
    ]),
  ).toEqual([
    "!node_modules/",
    "!nested/coverage/",
    "!src/**/dist/**",
    "!**/.DS_Store",
    "!nested/deep/Thumbs.db",
  ]);
});

test("ignores empty and earlier negations", () => {
  expect(findProtectedNegations(["!", "!nested/node_modules/", ...requiredRules])).toEqual([]);
});
