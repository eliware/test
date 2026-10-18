import { expect, test } from "@jest/globals";
import { isRedactedStreamPolicySuppressed } from "../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/is-policy-suppressed.mjs";

const trimSuffix = () => "";
const findSecretEnds = () => [];

test("does not suppress a policy with valid bounds and functions", () => {
  expect(isRedactedStreamPolicySuppressed(5, 10, trimSuffix, findSecretEnds)).toBe(false);
});

test("suppresses a policy when a secret exceeds the output limit", () => {
  expect(isRedactedStreamPolicySuppressed(11, 10, trimSuffix, findSecretEnds)).toBe(true);
});

test("suppresses a policy when suffix trimming is unavailable", () => {
  expect(isRedactedStreamPolicySuppressed(5, 10, null, findSecretEnds)).toBe(true);
});

test("suppresses a policy when secret matching is unavailable", () => {
  expect(isRedactedStreamPolicySuppressed(5, 10, trimSuffix, null)).toBe(true);
});
