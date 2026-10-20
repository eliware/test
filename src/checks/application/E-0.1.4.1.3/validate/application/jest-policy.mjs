import { validateJestConfiguration } from "../jest/configuration.mjs";
import { validateJestSourcePolicy } from "../jest/source/policy.mjs";
import { validateApplicationTestTools } from "./metadata/test-tools.mjs";
import { validateApplicationTestToolScripts } from "./commands/test-tool-scripts.mjs";

export async function validateApplicationJestPolicy(context = {}) {
  const errors = validateJestConfiguration(context.packageJson ?? {});
  errors.push(...validateApplicationTestTools(context.packageJson ?? {}));
  errors.push(...validateApplicationTestToolScripts(context.packageJson ?? {}));
  errors.push(...(await validateJestSourcePolicy(context)));
  return errors;
}
