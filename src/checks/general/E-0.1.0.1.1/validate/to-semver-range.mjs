import semver from "semver";

export function toSemverRange(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const range = semver.validRange(value);
  if (range) return value;
  const alias = /^npm:(?:@[^/]+\/[^@]+|[^@]+)@(.+)$/u.exec(value);
  return alias && semver.validRange(alias[1]) ? alias[1] : null;
}
