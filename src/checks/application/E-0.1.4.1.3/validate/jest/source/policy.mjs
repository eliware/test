import { findSeparateTestRunnerConfigs } from "../../../find-separate-test-runner-configs.mjs";
import { collectJestPolicyFiles } from "../collect-policy-files.mjs";
import { validateJestSourceFilePolicy } from "./file-policy.mjs";
import { isPrimaryLibraryBarrel } from "./is-primary-library-barrel.mjs";

export async function validateJestSourcePolicy(context = {}) {
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
  for (const path of findSeparateTestRunnerConfigs(paths ?? []))
    errors.push(`${path} is a separate test runner or coverage configuration file.`);
  return errors;
}
