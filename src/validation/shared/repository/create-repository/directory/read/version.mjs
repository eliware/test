export function isReusableDirectoryVersion(previous, current) {
  return Boolean(previous?.cacheable && current.cacheable && previous.key === current.key);
}

export function hasDirectoryVersionChanged(before, after) {
  return before.key !== after.key;
}
