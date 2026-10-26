import { expect, jest, test } from "@jest/globals";
import { buildRedactedStreamPolicy } from "../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/build-policy.mjs";

test("returns a suppressed normalized policy without creating search state", () => {
  const matcher = jest.fn();
  const normalized = {
    maximumSecretLength: 10,
    policy: { suppressed: true, values: [], outputLimit: 5, workLimit: 10 },
  };

  expect(buildRedactedStreamPolicy(normalized, matcher)).toBe(normalized.policy);
  expect(matcher).not.toHaveBeenCalled();
});

test("adds search behavior to a normalized policy", () => {
  const matcher = jest.fn(() => () => []);
  const normalized = {
    maximumSecretLength: 3,
    policy: { suppressed: false, values: ["abc"], outputLimit: 5, workLimit: 10 },
  };

  const policy = buildRedactedStreamPolicy(normalized, matcher);

  expect(policy.suppressed).toBe(false);
  expect(policy.trimSuffix).toEqual(expect.any(Function));
  expect(policy.findSecretEnds).toEqual(expect.any(Function));
  expect(matcher).toHaveBeenCalledWith(["abc"], { maxScanWork: 10 });
});
