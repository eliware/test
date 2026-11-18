import collectJestPolicyFiles from "../collect-policy-files.mjs";
import validateJestSourceFilePolicy from "./file-policy.mjs";
import isPrimaryLibraryBarrel from "./is-primary-library-barrel.mjs";
import findSeparateTestRunnerConfigErrors from "./separate-config-errors.mjs";
export default async function validateJestSourcePolicy(context = {}) {
  const root = context.root ?? process.cwd();
  const inventory = context.repositoryInventory;
  const harness = context.packageJson?.name === "@eliware/test";
  const { errors, files, paths } = await collectJestPolicyFiles(inventory, root);
  for (const { path, content } of files) {
    errors.push(
      ...validateJestSourceFilePolicy(path, content, {
        harness,
        allowLibraryBarrel: isPrimaryLibraryBarrel(context.packageJson, path),
      }),
    );
  }
  errors.push(...findSeparateTestRunnerConfigErrors(paths ?? []));
  return errors;
}
