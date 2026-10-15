import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function readPackageJson(root) {
  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  if (!packageJson.eliware || typeof packageJson.eliware !== "object") {
    throw new Error("package.json.eliware is required for Eliware validation.");
  }
  return packageJson;
}
