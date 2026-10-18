import { expect, test } from "@jest/globals";
import { packedTargetMatches } from "../../../../../../src/validation/stages/pack/validate/packed/target-matches.mjs";

test("matches literal packed targets", () => {
  expect(packedTargetMatches("src/index.mjs", new Set(["src/index.mjs"]))).toBe(true);
  expect(packedTargetMatches("src/missing.mjs", new Set())).toBe(false);
});

test("matches wildcard targets across nested paths", () => {
  expect(
    packedTargetMatches("src/features/*.mjs", new Set(["src/features/nested/feature.mjs"])),
  ).toBe(true);
  expect(packedTargetMatches("src/features/*.mjs", new Set(["src/features/.mjs"]))).toBe(false);
  expect(packedTargetMatches("src/features/*.mjs", new Set())).toBe(false);
});

test("matches every wildcard in a packed target", () => {
  expect(packedTargetMatches("src/*/worker-*.mjs", new Set(["src/jobs/worker-main.mjs"]))).toBe(
    true,
  );
  expect(packedTargetMatches("src/*/worker-*.mjs", new Set(["src/jobs/worker.mjs"]))).toBe(false);
});
