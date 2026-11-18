import hasSmokeTargetBoundaryOverlap from "../validate/target-boundary.mjs";
export default function validateSmokeTargetBoundary(sourceRoot, targetRoot) {
  return hasSmokeTargetBoundaryOverlap(sourceRoot, targetRoot)
    ? "Smoke target must resolve outside the source checkout."
    : null;
}
