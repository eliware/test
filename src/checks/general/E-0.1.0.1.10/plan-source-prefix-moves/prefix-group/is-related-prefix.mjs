function isRelatedPrefix(left, right) {
  return left.startsWith(right) || right.startsWith(left);
}
export default isRelatedPrefix;
