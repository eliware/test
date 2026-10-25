import { lstat, realpath } from "node:fs/promises";
import { orchestrateSmokeTarget } from "./resolve-smoke-target/orchestrate.mjs";

export function resolveSmokeTarget(root, target, inspect = lstat, resolvePath = realpath) {
  return orchestrateSmokeTarget(root, target, inspect, resolvePath);
}
