import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { smokeTempPrefix } from "./validate/fresh-temp-root.mjs";
import { verifySmokeTempRoot } from "./verify-smoke-temp-root.mjs";

export async function createSmokeTempRoot(
  root,
  inspect,
  createTempRoot = mkdtemp,
  remove,
  resolvePath,
) {
  const createdPath = await createTempRoot(join(root, smokeTempPrefix));
  return verifySmokeTempRoot(root, createdPath, inspect, remove, resolvePath);
}
