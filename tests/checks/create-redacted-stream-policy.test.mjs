import { expect, jest, test } from "@jest/globals";
import { createRedactedStreamPolicy } from "../../src/checks/create-redacted-stream-policy.mjs";

test("normalizes search and pending limits and builds matcher state", () => {
  const getSecretMatcher = jest.fn(
    () => (text) => Array.from({ length: text.length + 1 }, () => 0),
  );
  const policy = createRedactedStreamPolicy(["secret", "secret", "", 7], 20, {
    maxSearchWorkPerChunk: 2_000_000,
    maxPendingLength: 100_000,
    getSecretMatcher,
  });
  expect(policy).toMatchObject({
    workLimit: 1_000_000,
    pendingLimit: 20,
    values: ["secret"],
    suppressed: false,
  });
  expect(policy.trimSuffix("safe secret")).toBe("safe secret");
  expect(policy.findSafeBoundary).toEqual(expect.any(Function));
  expect(getSecretMatcher).toHaveBeenCalledWith(["secret"], { maxScanWork: 1_000_000 });
});

test("clamps minimum limits and uses the default matcher when no matcher is injected", () => {
  const policy = createRedactedStreamPolicy([], 10, {
    maxSearchWorkPerChunk: 0,
    maxPendingLength: 0,
  });
  expect(policy).toMatchObject({ workLimit: 1, pendingLimit: 1, values: [], suppressed: false });
  expect(policy.findSecretEnds("safe")).toEqual([0, 0, 0, 0, 0]);
  expect(createRedactedStreamPolicy(["secret"], 20).suppressed).toBe(false);
});

test.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
  "uses the fixed search bound for non-finite work limits (%s)",
  (maxSearchWorkPerChunk) => {
    expect(createRedactedStreamPolicy(["secret"], 20, { maxSearchWorkPerChunk }).workLimit).toBe(
      1_000_000,
    );
  },
);

test("suppresses unsafe output when a secret is too long for the output limit", () => {
  const policy = createRedactedStreamPolicy(["oversized"], 2);
  expect(policy.suppressed).toBe(true);
  expect(policy.trimSuffix).toBeNull();
  expect(policy.findSecretEnds).toBeNull();
  expect(policy.findSafeBoundary).toBeNull();
});

test("retains enough bounded text to redact secrets longer than the default window", () => {
  const longSecret = "s".repeat(65_000);
  const policy = createRedactedStreamPolicy([longSecret], 70_000, {
    maxPendingLength: 16,
    getSecretMatcher: () => () => [],
  });

  expect(policy.pendingLimit).toBe(longSecret.length);
  expect(policy.suppressed).toBe(false);
});

test("suppresses output when suffix preprocessing would exceed its work budget", () => {
  const secrets = Array.from({ length: 3 }, (_, index) => `${index}${"x".repeat(59_999)}`);
  const policy = createRedactedStreamPolicy(secrets, 100_000);
  expect(policy.suppressed).toBe(true);
  expect(policy.trimSuffix).toBeNull();
});

test.each([null, {}])("suppresses output when matcher construction returns %p", (matcher) => {
  const policy = createRedactedStreamPolicy(["secret"], 20, {
    getSecretMatcher: () => matcher,
  });

  expect(policy).toMatchObject({
    findSecretEnds: null,
    findSafeBoundary: null,
    suppressed: true,
  });
});
