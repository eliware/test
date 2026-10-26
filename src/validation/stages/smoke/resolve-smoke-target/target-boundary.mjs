import { containsOrMatches } from "./containment.mjs";

export function validateSmokeTargetBoundary(sourceRoot, targetRoot) {
  return containsOrMatches(sourceRoot, targetRoot) || containsOrMatches(targetRoot, sourceRoot)
    ? "Smoke target must resolve outside the source checkout."
    : null;
}
