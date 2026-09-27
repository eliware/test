import { expect, test } from "@jest/globals";
import {
  createPartialSecretSuffixTrimmer,
  trimPartialSecretSuffix,
} from "../../src/checks/create-partial-secret-suffix-trimmer.mjs";

test("holds back suffixes that could continue into a secret", () => {
  const trim = createPartialSecretSuffixTrimmer(["credential-value", "ababac"]);
  expect(trim("prefix credential-")).toBe("prefix ");
  expect(trim("ababab")).toBe("ab");
  expect(trim("ababy")).toBe("ababy");
});

test("keeps all text when no secret suffix can match", () => {
  expect(trimPartialSecretSuffix("ordinary", [])).toBe("ordinary");
  expect(trimPartialSecretSuffix("safe", ["credential-value"])).toBe("safe");
});

test("handles repeated-prefix secrets without rescanning unbounded text", () => {
  expect(trimPartialSecretSuffix("prefix ababab", ["ababac"])).toBe("prefix ab");
});
