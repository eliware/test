import { minimatch } from "minimatch";

export function pullRequestTargetsMain(event) {
  if (event === undefined || event === null || event === false) return false;
  if (Array.isArray(event)) return branchPatternsAllowMain(event, false);
  if (typeof event !== "object") return false;
  if (
    Array.isArray(event["branches-ignore"]) &&
    (event["branches-ignore"].some((pattern) => typeof pattern !== "string") ||
      event["branches-ignore"].some(patternMatchesMain))
  )
    return false;
  return branchPatternsAllowMain(event.branches, false);
}

export function pushTargetsMain(push) {
  if (Array.isArray(push)) return branchPatternsAllowMain(push, false);
  if (push === null || push === false || push === undefined) return false;
  if (typeof push !== "object") return false;
  if (
    Array.isArray(push["branches-ignore"]) &&
    (push["branches-ignore"].some((pattern) => typeof pattern !== "string") ||
      push["branches-ignore"].some(patternMatchesMain))
  )
    return false;
  return branchPatternsAllowMain(push.branches, false);
}

function patternMatchesMain(pattern) {
  const positive = pattern.startsWith("!") ? pattern.slice(1) : pattern;
  return minimatch("main", positive, { dot: true, nonegate: true, nocomment: true });
}

function branchPatternsAllowMain(patterns, defaultValue) {
  if (!Array.isArray(patterns) || patterns.length === 0) return defaultValue;
  let included = false;
  for (const pattern of patterns) {
    if (typeof pattern !== "string") return false;
    if (patternMatchesMain(pattern)) included = !pattern.startsWith("!");
  }
  return included;
}
