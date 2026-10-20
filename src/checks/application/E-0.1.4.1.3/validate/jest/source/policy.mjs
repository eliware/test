import { posix } from "node:path";
import { findSeparateTestRunnerConfigs } from "../../../find-separate-test-runner-configs.mjs";
import { collectJestPolicyFiles } from "../collect-policy-files.mjs";
import { validateJestSourceFilePolicy } from "./file-policy.mjs";

export async function validateJestSourcePolicy(context = {}) {
  const root = context.root ?? process.cwd();
  const inventory = context.repositoryInventory;
  const harness = context.packageJson?.name === "@eliware/test";
  const applied = context.packageJson?.eliware?.apply ?? [];
  const main = context.packageJson?.main;
  const primaryEntry =
    typeof main === "string" && main.startsWith("./") ? posix.normalize(main.slice(2)) : null;
  const { errors, files, paths } = await collectJestPolicyFiles(inventory, root);
  for (const { path, content } of files) {
    errors.push(
      ...validateJestSourceFilePolicy(path, content, {
        harness,
        allowLibraryBarrel:
          applied.includes("library") && !applied.includes("application") && path === primaryEntry,
      }),
    );
  }
  for (const path of findSeparateTestRunnerConfigs(paths ?? []))
    errors.push(`${path} is a separate test runner or coverage configuration file.`);
  return errors;
}
