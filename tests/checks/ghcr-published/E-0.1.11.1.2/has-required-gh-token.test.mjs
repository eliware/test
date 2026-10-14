import { expect, test } from "@jest/globals";
import { hasRequiredGhToken } from "../../../../src/checks/ghcr-published/E-0.1.11.1.2/has-required-gh-token.mjs";

test("accepts the token on the verification step", () => {
  expect(hasRequiredGhToken({ env: { GH_TOKEN: "${{ github.token }}" } }, {})).toBe(true);
});

test("accepts the token on the publish job when the step omits it", () => {
  expect(hasRequiredGhToken({}, { env: { GH_TOKEN: "${{ github.token }}" } })).toBe(true);
});

test("rejects a missing token", () => {
  expect(hasRequiredGhToken({}, {})).toBe(false);
});

test("rejects an incorrect step token when the job token is correct", () => {
  expect(
    hasRequiredGhToken(
      { env: { GH_TOKEN: "wrong" } },
      { env: { GH_TOKEN: "${{ github.token }}" } },
    ),
  ).toBe(false);
});
