import { validateJestConfiguration } from "./validate-jest-configuration.mjs";
import { validateJestSourcePolicy } from "./validate-jest-source-policy.mjs";

export async function validateApplicationJestPolicy(context = {}) {
  const errors = validateJestConfiguration(context.packageJson ?? {});
  errors.push(...validateDirectTestTools(context.packageJson ?? {}));
  errors.push(...(await validateJestSourcePolicy(context)));
  return errors;
}

function validateDirectTestTools(packageJson) {
  // Eliware Test must provide Jest when a consumer has no local Jest install.
  if (packageJson.name === "@eliware/test") return [];
  const sections = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
  const dependencies = sections.flatMap((section) => Object.entries(packageJson[section] ?? {}));
  const direct = dependencies
    .filter(([name, version]) => isAlternativeTestOrCoverageTool(name, version))
    .map(([name]) => name);
  const errors = direct.length
    ? [`Do not declare separate test or coverage tools: ${direct.join(", ")}.`]
    : [];
  for (const [name, command] of Object.entries(packageJson.scripts ?? {}))
    if (typeof command === "string" && hasAlternativeToolCommand(command))
      errors.push(`package.json script ${name} must not invoke a separate test or coverage tool.`);
  if (packageJson.nyc || packageJson.c8 || packageJson.vitest)
    errors.push("package.json must not configure a separate test runner or coverage engine.");
  return errors;
}

function isAlternativeTestOrCoverageTool(name, version) {
  return (
    name === "jest" ||
    name.startsWith("jest-") ||
    name.startsWith("@jest/") ||
    name === "babel-jest" ||
    name === "istanbul" ||
    name === "babel-plugin-istanbul" ||
    name.startsWith("istanbul-lib-") ||
    name.startsWith("@istanbuljs/") ||
    [
      "ava",
      "c8",
      "cypress",
      "jasmine",
      "jasmine-core",
      "karma",
      "mocha",
      "nyc",
      "playwright",
      "qunit",
      "tap",
      "tape",
      "uvu",
      "vitest",
      "webdriverio",
    ].includes(name) ||
    name.startsWith("@playwright/") ||
    name.startsWith("@vitest/coverage-") ||
    (typeof version === "string" &&
      /^npm:(?:@jest\/|jest|vitest|mocha|ava|tap|tape|uvu|c8|nyc)/iu.test(version))
  );
}

function hasAlternativeToolCommand(command) {
  return (
    /(?:^|[\s;&|])(?:npx\s+)?(?:jest|vitest|mocha|ava|tap|tape|uvu|c8|nyc|istanbul|playwright|cypress|bun\s+test|deno\s+test)(?=$|\s)/iu.test(
      command,
    ) ||
    /node_modules[\\/]\.bin[\\/](?:jest|vitest|mocha|ava|tap|tape|uvu|c8|nyc|istanbul)/iu.test(
      command,
    ) ||
    /\bnode\s+--test(?:\s|$)/iu.test(command)
  );
}
