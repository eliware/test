import { expect, test } from "@jest/globals";
import { matchesWebAssetExclusion } from "../../../../src/checks/web/E-0.1.50/matches-web-asset-exclusion.mjs";

test("matches exclusions by path segment with normalized separators", () => {
  expect(matchesWebAssetExclusion("assets\\dist\\app.js", "dist/")).toBe(true);
  expect(matchesWebAssetExclusion("assets/tmp-cache", "tmp*")).toBe(true);
  expect(matchesWebAssetExclusion("assets/app.js", "dist")).toBe(false);
  expect(matchesWebAssetExclusion("assets/my-dist/app.js", "dist")).toBe(false);
});

test("matches exclusions at the root and escapes regular expression characters", () => {
  expect(matchesWebAssetExclusion(".git/config", ".git")).toBe(true);
  expect(matchesWebAssetExclusion("assets/a+b/file.js", "a+b")).toBe(true);
});
