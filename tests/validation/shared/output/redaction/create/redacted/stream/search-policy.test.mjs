import { expect, jest, test } from "@jest/globals";
import { createRedactedSearchPolicy } from "../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/search-policy.mjs";

test("builds secret matching and safe-boundary search state", () => {
  const matcher = jest.fn(() => () => []);
  const policy = createRedactedSearchPolicy(["secret"], 6, 20, 100, matcher);

  expect(policy).toMatchObject({ suppressed: false });
  expect(policy.trimSuffix).toEqual(expect.any(Function));
  expect(policy.findSecretEnds).toEqual(expect.any(Function));
  expect(policy.findSafeBoundary).toEqual(expect.any(Function));
  expect(matcher).toHaveBeenCalledWith(["secret"], { maxScanWork: 100 });
});

test("suppresses unsafe secrets and matcher results", () => {
  const tooLong = createRedactedSearchPolicy(["secret"], 6, 5, 100, jest.fn());
  const invalidMatcher = createRedactedSearchPolicy(["secret"], 6, 10, 100, () => null);

  expect(tooLong).toMatchObject({ trimSuffix: null, findSecretEnds: null, suppressed: true });
  expect(invalidMatcher).toMatchObject({
    findSecretEnds: null,
    findSafeBoundary: null,
    suppressed: true,
  });
});

test("uses the default matcher for an empty normalized secret list", () => {
  const policy = createRedactedSearchPolicy([], 0, 10, 100);

  expect(policy.suppressed).toBe(false);
  expect(policy.findSecretEnds("text")).toEqual([0, 0, 0, 0, 0]);
});
