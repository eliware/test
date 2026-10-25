import { expect, test } from "@jest/globals";
import { isUniversalIgnoreRule } from "../../../../../../src/checks/general/E-0.1.0.1.8/validate/ignore-patterns/is-universal-ignore-rule.mjs";

test.each(["coverage", "coverage/", "**/coverage", "**/coverage/", "**/coverage/**"])(
  "accepts universal ignore pattern %s",
  (rule) => expect(isUniversalIgnoreRule(rule, "coverage")).toBe(true),
);

test.each(["!coverage", "local/coverage", "coverage/**", "**/coverage/files"])(
  "rejects non-universal ignore pattern %s",
  (rule) => expect(isUniversalIgnoreRule(rule, "coverage")).toBe(false),
);
