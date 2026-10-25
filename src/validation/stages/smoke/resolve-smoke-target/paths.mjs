import { isAbsolute, relative, sep } from "node:path";

export async function resolveSmokeTargetPaths(root, target, resolvePath) {
  let sourceRoot;
  let targetRoot;
  try {
    [sourceRoot, targetRoot] = await Promise.all([resolvePath(root), resolvePath(target)]);
  } catch {
    return { error: "Smoke source and target must both resolve to existing directories." };
  }
  if (containsOrMatches(sourceRoot, targetRoot) || containsOrMatches(targetRoot, sourceRoot))
    return { error: "Smoke target must resolve outside the source checkout." };
  return { targetRoot };
}

function containsOrMatches(parent, path) {
  const relativePath = relative(parent, path);
  return (
    relativePath === "" ||
    (relativePath !== ".." && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath))
  );
}
