import { inspectSmokeTargetIdentity } from "./identity.mjs";
import { resolveSmokeTargetPaths } from "./paths.mjs";

export async function orchestrateSmokeTarget(root, target, inspect, resolvePath) {
  const paths = await resolveSmokeTargetPaths(root, target, resolvePath);
  if (paths.error) return paths;
  const identity = await inspectSmokeTargetIdentity(paths.targetRoot, inspect);
  if (identity.error) return identity;
  return { targetRoot: paths.targetRoot, assertIdentity: identity.assertIdentity };
}
