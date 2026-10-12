export function getRepositoryDirectoryVersion(metadata, platform) {
  // codescope ignore: Windows disables reuse but still compares snapshots around readdir.
  const nanosecondTimestamps =
    typeof metadata.mtimeNs === "bigint" &&
    typeof metadata.ctimeNs === "bigint" &&
    typeof metadata.birthtimeNs === "bigint";
  return {
    cacheable: platform !== "win32" && nanosecondTimestamps,
    // String conversion is safe for BigIntStats.
    key: [
      metadata.dev,
      metadata.ino,
      metadata.size,
      metadata.mtimeNs,
      metadata.ctimeNs,
      metadata.birthtimeNs,
    ]
      .map(String)
      .join(":"),
  };
}
