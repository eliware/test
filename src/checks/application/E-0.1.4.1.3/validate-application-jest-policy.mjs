import { validateJestConfiguration } from "./validate-jest-configuration.mjs";
import { validateJestSourcePolicy } from "./validate-jest-source-policy.mjs";

export async function validateApplicationJestPolicy(context = {}) {
  const errors = validateJestConfiguration(context.packageJson ?? {});
  errors.push(...validateDirectJestDependencies(context.packageJson ?? {}));
  errors.push(...(await validateJestSourcePolicy(context)));
  return errors;
}

function validateDirectJestDependencies(packageJson) {
  // Eliware Test must provide Jest when a consumer has no local Jest install.
  if (packageJson.name === "@eliware/test") return [];
  const sections = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
  const names = sections.flatMap((section) => Object.keys(packageJson[section] ?? {}));
  const direct = names.filter((name) => name === "jest" || name.startsWith("@jest/"));
  return direct.length ? [`Do not declare Jest packages directly: ${direct.join(", ")}.`] : [];
}
