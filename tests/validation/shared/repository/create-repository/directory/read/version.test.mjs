import { expect, test } from "@jest/globals";
import {
  hasDirectoryVersionChanged,
  isReusableDirectoryVersion,
} from "../../../../../../../src/validation/shared/repository/create-repository/directory/read/version.mjs";

test("reuses matching cacheable directory versions", () => {
  const previous = { key: "same", cacheable: true };
  expect(isReusableDirectoryVersion(previous, { key: "same", cacheable: true })).toBe(true);
  expect(isReusableDirectoryVersion(previous, { key: "changed", cacheable: true })).toBe(false);
  expect(isReusableDirectoryVersion(previous, { key: "same", cacheable: false })).toBe(false);
  expect(isReusableDirectoryVersion(undefined, { key: "same", cacheable: true })).toBe(false);
});

test("detects a directory version change during a read", () => {
  expect(hasDirectoryVersionChanged({ key: "before" }, { key: "after" })).toBe(true);
  expect(hasDirectoryVersionChanged({ key: "same" }, { key: "same" })).toBe(false);
});
