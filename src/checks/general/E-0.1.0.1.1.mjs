import { fail, pass } from "../check-result.mjs";
import { validatePackageMetadata } from "./E-0.1.0.1.1/validate-package-metadata.mjs";
import { validateRequiredPackageFiles } from "./E-0.1.0.1.1/validate-required-package-files.mjs";
import { validatePackageLock } from "./E-0.1.0.1.1/validate-package-lock.mjs";
import { findCommonJsUses } from "./E-0.1.0.1.1/find-commonjs-uses.mjs";
import { validatePackageKeyOrder } from "./E-0.1.0.1.1/validate-package-key-order.mjs";

export const ruleId = "E-0.1.0.1.1";

export async function run(context = {}) {
  const root = context.root ?? process.cwd();
  const errors = [
    ...validatePackageMetadata(context.packageJson),
    ...validatePackageKeyOrder(context.packageJson),
  ];
  errors.push(...(await validateRequiredPackageFiles(root)));
  errors.push(...(await validatePackageLock(root, context.packageJson)));
  const files = context.repositoryFiles ?? (await context.repositoryInventory?.repositoryFiles?.());
  errors.push(...(await findCommonJsUses(root, context.packageJson, files, context.parseAst)));
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
