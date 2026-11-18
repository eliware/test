import containsOrMatches from "../resolve-smoke-target/containment.mjs";
export default function hasSmokeTargetBoundaryOverlap(sourceRoot, targetRoot) {
  return containsOrMatches(sourceRoot, targetRoot) || containsOrMatches(targetRoot, sourceRoot);
}
