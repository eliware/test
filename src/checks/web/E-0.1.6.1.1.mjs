import { join } from "node:path";
import { fail, pass } from "../check-result.mjs";
import { collectWebAssetDirectories } from "./E-0.1.6.1.1/collect-web-asset-directories.mjs";
import { validateWebAssetMetadata } from "./E-0.1.6.1.1/validate-web-asset-metadata.mjs";

export const ruleId = "E-0.1.6.1.1";

export async function run(context = {}, dependencies = {}) {
  const errors = validateWebAssetMetadata(context.packageJson);
  try {
    const directories = await collectWebAssetDirectories(
      join(context.root ?? process.cwd(), "public"),
      context.repositoryInventory,
      dependencies,
    );
    for (const directory of directories) {
      errors.push(`Web public assets must not include excluded directory: public/${directory}.`);
    }
  } catch {
    errors.push("public/ is required as the web asset root.");
  }
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
