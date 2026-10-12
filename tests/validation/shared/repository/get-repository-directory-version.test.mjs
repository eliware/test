import { expect, test } from "@jest/globals";
import { getRepositoryDirectoryVersion } from "../../../../src/validation/shared/repository/get-repository-directory-version.mjs";

const metadata = (mtimeNs) => ({
  dev: 1n,
  ino: 2n,
  size: 0n,
  mtimeNs,
  ctimeNs: mtimeNs,
  birthtimeNs: 3n,
});

test.each([
  [
    "coarse millisecond fields",
    { dev: 1n, ino: 2n, size: 0n, mtimeMs: 1n, ctimeMs: 1n },
    "linux",
    false,
  ],
  ["Windows metadata", metadata(1n), "win32", false],
  ["precise nanoseconds", metadata(1n), "linux", true],
  ["missing birth time", { ...metadata(1n), birthtimeNs: undefined }, "linux", false],
])("sets cacheability for %s", (_name, snapshot, platform, cacheable) => {
  expect(getRepositoryDirectoryVersion(snapshot, platform).cacheable).toBe(cacheable);
});

test("keeps nanosecond timestamps in the version key", () => {
  const first = getRepositoryDirectoryVersion(metadata(1n), "linux");
  const second = getRepositoryDirectoryVersion(metadata(2n), "linux");
  expect(first.key).not.toBe(second.key);
});
