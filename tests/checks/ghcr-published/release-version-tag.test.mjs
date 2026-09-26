import { expect, test } from "@jest/globals";
import {
  hasReleaseTagGuard,
  isTagRelease,
  releaseTagFilter,
  releaseTagGuard,
  tagMatchesPackageVersion,
} from "../../../src/checks/ghcr-published/release-version-tag.mjs";

test("defines a GitHub glob candidate and a strict semver tag guard", () => {
  expect(releaseTagFilter).toBe("v[0-9]*.[0-9]*.[0-9]*");
  expect(hasReleaseTagGuard(releaseTagGuard)).toBe(true);
  expect(hasReleaseTagGuard('test "$(npm pkg get version --raw)" = "${GITHUB_REF_NAME#v}"')).toBe(false);
});

test("accepts only exact numeric version tags matching the package", () => {
  expect(tagMatchesPackageVersion("v1.2.3", "1.2.3")).toBe(true);
  expect(tagMatchesPackageVersion(null, "1.2.3")).toBe(false);
  for (const tag of ["v1x.2.3", "v01.2.3", "v1.2", "v1.2.3-preview", "v1.2.3.extra"]) {
    expect(tagMatchesPackageVersion(tag, "1.2.3")).toBe(false);
  }
});

test("detects tag-triggered execution", () => {
  expect(typeof isTagRelease()).toBe("boolean");
  expect(isTagRelease({ GITHUB_REF_TYPE: "tag" })).toBe(true);
  expect(isTagRelease({ GITHUB_REF_TYPE: "branch" })).toBe(false);
  expect(isTagRelease({})).toBe(false);
});
