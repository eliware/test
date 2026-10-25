import { expect, jest, test } from "@jest/globals";
import { createRedactedStreamPolicy } from "../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/policy.mjs";

test("composes normalized values with bounded secret search state", () => {
  const getSecretMatcher = jest.fn(
    () => (text) => Array.from({ length: text.length + 1 }, () => 0),
  );
  const policy = createRedactedStreamPolicy(["secret", "secret", "", 7], 20, {
    maxSearchWorkPerChunk: 2_000_000,
    maxPendingLength: 100_000,
    getSecretMatcher,
  });

  expect(policy).toMatchObject({
    outputLimit: 20,
    workLimit: 1_000_000,
    pendingLimit: 20,
    values: ["secret"],
    suppressed: false,
  });
  expect(policy.trimSuffix("safe secret")).toBe("safe secret");
  expect(policy.findSafeBoundary).toEqual(expect.any(Function));
  expect(getSecretMatcher).toHaveBeenCalledWith(["secret"], { maxScanWork: 1_000_000 });
});

test("returns suppressed normalization without building search state", () => {
  const policy = createRedactedStreamPolicy(["s".repeat(166_667)], 200_000);

  expect(policy).toMatchObject({
    outputLimit: 200_000,
    values: [],
    trimSuffix: null,
    findSecretEnds: null,
    findSafeBoundary: null,
    suppressed: true,
  });
});

test("passes invalid matcher results through as a suppressed search policy", () => {
  const policy = createRedactedStreamPolicy(["secret"], 20, {
    getSecretMatcher: () => null,
  });

  expect(policy).toMatchObject({
    findSecretEnds: null,
    findSafeBoundary: null,
    suppressed: true,
  });
});
