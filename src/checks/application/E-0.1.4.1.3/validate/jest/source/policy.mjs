import collectJestPolicyFiles from "./collect-files.mjs";
import validateJestPolicyFiles from "./validate-files.mjs";
import findSeparateTestRunnerConfigErrors from "./separate-config-errors.mjs";
export default async function validateJestSourcePolicy(context = {}) {
  const root = context.root ?? process.cwd();
  const inventory = context.repositoryInventory;
  const harness = context.packageJson?.name === "@eliware/test";
  const { errors, files, paths } = await collectJestPolicyFiles(inventory, root);
  validateJestPolicyFiles(files, errors, context.packageJson, harness);
  errors.push(...findSeparateTestRunnerConfigErrors(paths ?? []));
  return errors;
}
