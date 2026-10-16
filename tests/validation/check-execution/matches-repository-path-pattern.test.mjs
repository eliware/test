import { expect, test } from "@jest/globals";
import { matchesRepositoryPathPattern } from "../../../src/validation/check-execution/matches-repository-path-pattern.mjs";

test("matches exact paths and normalizes repository path separators", () => {
  expect(matchesRepositoryPathPattern("docs/guide.md", "docs\\guide.md")).toBe(true);
  expect(matchesRepositoryPathPattern("docs/guide.md", "docs/other.md")).toBe(false);
});

test("matches one segment with a single wildcard", () => {
  expect(matchesRepositoryPathPattern("docs/*.yml", "docs/policy.yml")).toBe(true);
  expect(matchesRepositoryPathPattern("docs/*.yml", "docs/nested/policy.yml")).toBe(false);
});

test("matches zero or more directories with a double wildcard", () => {
  expect(matchesRepositoryPathPattern("**/secrets/**", "secrets/token.yaml")).toBe(true);
  expect(
    matchesRepositoryPathPattern(
      "infrastructure/**/secrets/**",
      "infrastructure/secrets/token.yaml",
    ),
  ).toBe(true);
  expect(
    matchesRepositoryPathPattern(
      "infrastructure/**/secrets/**",
      "infrastructure/cluster/secrets/token.yaml",
    ),
  ).toBe(true);
  expect(
    matchesRepositoryPathPattern(
      "infrastructure/**/secrets/**",
      "infrastructure/cluster/config.yaml",
    ),
  ).toBe(false);
});
