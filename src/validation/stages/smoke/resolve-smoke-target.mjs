import { lstat, realpath } from "node:fs/promises";
import { inspectSmokeTargetIdentity } from "./resolve-smoke-target/identity.mjs";
import { resolveSmokeTargetPaths } from "./resolve-smoke-target/paths.mjs";

export async function resolveSmokeTarget(root, target, inspect = lstat, resolvePath = realpath) {
  const paths = await resolveSmokeTargetPaths(root, target, resolvePath);
  if (paths.error) return paths;
  const identity = await inspectSmokeTargetIdentity(paths.targetRoot, inspect);
  if (identity.error) return identity;
  return { targetRoot: paths.targetRoot, assertIdentity: identity.assertIdentity };
}
