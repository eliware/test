import { runNpmConsumerSmoke } from "../run/npm-consumer-smoke.mjs";
import { readSmokePackageJson } from "./read-package-json.mjs";

export async function runSmokeCommand({ root, target, write, smoke = runNpmConsumerSmoke, read }) {
  const packageJson = await readSmokePackageJson(root, read);
  return smoke({ root, packageJson, target, write });
}
