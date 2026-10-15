import { validateJestConfiguration } from "../jest/configuration.mjs";
import { validateJestSourcePolicy } from "../jest/source-policy.mjs";
import { validateApplicationTestTools } from "./test-tools.mjs";
import { validateTestIsolation } from "../test-isolation/validate-test-isolation.mjs";

export async function validateApplicationJestPolicy(context = {}) {
  const errors = validateJestConfiguration(context.packageJson ?? {});
  errors.push(...validateApplicationTestTools(context.packageJson ?? {}));
  errors.push(...(await validateJestSourcePolicy(context)));
  errors.push(...(await validateTestIsolation(context)));
  return errors;
}
