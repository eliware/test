import fail from "../check-result/fail.mjs";
import pass from "../check-result.mjs";
import hasCommonJsPackageEntrypoint from "./E-0.1.0.1.1/find-commonjs/package-entrypoints.mjs";
import findCommonJsSourceUses from "./E-0.1.0.1.1/source-commonjs-uses.mjs";

export const ruleId = "E-0.1.0.1.15";
export default async function run(context = {}, dependencies = {}) {
  const root = context.root ?? process.cwd();
  const files = context.repositoryFiles ?? (await context.repositoryInventory?.repositoryFiles?.());
  const scanSources = dependencies.scanSources ?? findCommonJsSourceUses;
  const errors = await scanSources(root, files, context.parseAst);
  if (hasCommonJsPackageEntrypoint(context.packageJson))
    errors.push("package.json: CommonJS entrypoint or export");
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
