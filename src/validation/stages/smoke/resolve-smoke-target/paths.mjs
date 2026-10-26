import { validateSmokeTargetBoundary } from "./target-boundary.mjs";

export async function resolveSmokeTargetPaths(root, target, resolvePath) {
  let sourceRoot;
  let targetRoot;
  try {
    [sourceRoot, targetRoot] = await Promise.all([resolvePath(root), resolvePath(target)]);
  } catch {
    return { error: "Smoke source and target must both resolve to existing directories." };
  }
  const boundaryError = validateSmokeTargetBoundary(sourceRoot, targetRoot);
  if (boundaryError) return { error: boundaryError };
  return { targetRoot };
}
