import { validateJestConfiguration } from "../jest/configuration.mjs";
import { validateJestSourcePolicy } from "../jest/source-policy.mjs";
import { validateApplicationTestTools } from "./test-tools.mjs";

export async function validateApplicationJestPolicy(context = {}) {
  const errors = validateJestConfiguration(context.packageJson ?? {});
  errors.push(...validateApplicationTestTools(context.packageJson ?? {}));
  errors.push(...(await validateJestSourcePolicy(context)));
  return errors;
}
