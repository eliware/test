export function validateApplicationTestTools(packageJson = {}) {
  const harness = packageJson.name === "@eliware/test";
  const allowedHarnessTools = new Set(["jest", "istanbul-lib-instrument"]);
  const sections = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
  const dependencies = sections.flatMap((section) => Object.entries(packageJson[section] ?? {}));
  const direct = dependencies
    .filter(
      ([name, version]) =>
        isAlternativeTestOrCoverageTool(name, version) &&
        !(harness && allowedHarnessTools.has(name)),
    )
    .map(([name]) => name);
  const errors = direct.length
    ? [`Do not declare separate test or coverage tools: ${direct.join(", ")}.`]
    : [];
  for (const [name, command] of Object.entries(packageJson.scripts ?? {}))
    if (typeof command === "string" && hasAlternativeToolCommand(command))
      errors.push(`package.json script ${name} must not invoke a separate test or coverage tool.`);
  if (
    [
      "ava",
      "@bcoe/v8-coverage",
      "c8",
      "cypress",
      "jasmine",
      "nightwatch",
      "protractor",
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
      "testcafe",
      "istanbul",
      "coverage",
      "nodeTestRunner",
      "testRunner",
      "test-runner",
    ].some((key) => packageJson[key] !== undefined)
  )
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
    ["@playwright/", "@vitest/", "@tapjs/", "@wdio/", "@cypress/"].some((prefix) =>
      name.startsWith(prefix),
    ) ||
    (typeof version === "string" &&
      /^npm:(?:@jest\/|@playwright\/|@vitest\/|@tapjs\/|@wdio\/|@cypress\/|jest|vitest|mocha|ava|tap|tape|uvu|c8|nyc|istanbul|playwright|cypress|jasmine)/iu.test(
        version,
      ))
  );
}

function hasAlternativeToolCommand(command) {
  return (
    /(?:^|[\s;&|])(?:(?:jest|vitest|mocha|ava|tap|tape|uvu|c8|nyc|istanbul|playwright|cypress|karma|jasmine|qunit|wdio|nightwatch|testcafe|protractor|bun\s+test|deno\s+test)|(?:(?:npx|npm\s+exec|pnpm(?:\s+(?:exec|dlx))?|yarn(?:\s+(?:dlx|exec))?|bunx)(?:\s+--[^\s]+)*\s+(?:--\s+)?(?:jest|vitest|mocha|ava|tap|tape|uvu|c8|nyc|istanbul|playwright|cypress|karma|jasmine|qunit|wdio|nightwatch|testcafe|protractor)))(?=$|\s)/iu.test(
      command,
    ) ||
    /node_modules[\\/]\.bin[\\/](?:jest|vitest|mocha|ava|tap|tape|uvu|c8|nyc|istanbul)/iu.test(
      command,
    ) ||
    /\bnode\s+(?:--[\w-]+(?:=\S+)?\s+)*--test(?=$|\s)/iu.test(command)
  );
}
