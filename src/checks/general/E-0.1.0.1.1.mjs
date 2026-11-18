import { readFile, stat } from "node:fs/promises";
import fail from "../check-result/fail.mjs";
import pass from "../check-result.mjs";
import validateLicenseContent, {
  expectedLicense,
} from "./E-0.1.0.1.1/validate/license-content.mjs";
import validatePackageMetadata from "./E-0.1.0.1.1/validate/package/metadata.mjs";
import validateRequiredPackageFiles from "./E-0.1.0.1.1/validate/required-package-files.mjs";
import validatePackageKeyOrder from "./E-0.1.0.1.1/validate/package/key-order.mjs";
export const ruleId = "E-0.1.0.1.1";
export default async function run(context = {}, dependencies = {}) {
  const root = context.root ?? process.cwd();
  const errors = [
    ...validatePackageMetadata(context.packageJson),
    ...validatePackageKeyOrder(context.packageJson),
  ];
  errors.push(
    ...(await validateRequiredPackageFiles(root, { getStat: dependencies.getStat ?? stat })),
  );
  errors.push(
    ...(await validateLicenseContent(root, dependencies.read ?? readFile, expectedLicense)),
  );
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
