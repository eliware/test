import { validateJestConfiguration } from "./validate-jest-configuration.mjs";
import { validateJestSourcePolicy } from "./validate-jest-source-policy.mjs";
import { validateApplicationTestTools } from "./validate-application-test-tools.mjs";

export async function validateApplicationJestPolicy(context = {}) {
  const errors = validateJestConfiguration(context.packageJson ?? {});
  errors.push(...validateApplicationTestTools(context.packageJson ?? {}));
  errors.push(...(await validateJestSourcePolicy(context)));
  return errors;
}
