import { lstat } from "node:fs/promises";
import { loadSmokeTarget } from "../load-smoke-target.mjs";
import { resolveSmokeTarget } from "../resolve-smoke-target.mjs";
import { validateNpmConsumerSmokeRequest } from "../validate/npm-consumer-smoke-request.mjs";
import { createSmokeTargetContext } from "./create-target-context.mjs";

export async function prepareSmokeTargetContext({
  root,
  target,
  packageJson,
  env = process.env,
  inspectTargetRoot = lstat,
}) {
  const request = validateNpmConsumerSmokeRequest({ root, target, packageJson });
  if (request.error) return request;
  const targetResolution = await resolveSmokeTarget(root, request.targetRoot, inspectTargetRoot);
  if (targetResolution.error) return targetResolution;
  const { targetRoot, assertIdentity } = targetResolution;
  const loadedTarget = await loadSmokeTarget(targetRoot, packageJson?.name);
  if (loadedTarget.error) return loadedTarget;
  return createSmokeTargetContext(targetRoot, assertIdentity, packageJson, env);
}
