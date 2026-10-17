const patterns = [
  /[a-z]:[\\/]+(?:users|home|srv|var[\\/]lib)[\\/]+[^\s"'`,;\])]+/iu,
  /(?:^|[^a-z0-9])(?:C:|D:)[\\/]+(?:eliware|Users[\\/]\w+[\\/]src)(?:[\\/]|$)/iu,
];

export function hasWindowsMachineSpecificPath(content) {
  return patterns.some((pattern) => pattern.test(content));
}
