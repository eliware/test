import fail from "../check-result/fail.mjs";
import pass from "../check-result.mjs";
import validatePackageLock from "./E-0.1.0.1.1/validate/package/lock.mjs";

export const ruleId = "E-0.1.0.1.14";
export default async function run(context = {}, dependencies = {}) {
  const errors = await validatePackageLock(
    context.root ?? process.cwd(),
    context.packageJson,
    dependencies,
  );
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
