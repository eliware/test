export default function isReusableDirectoryVersion(previous, current) {
  return Boolean(previous?.cacheable && current.cacheable && previous.key === current.key);
}
