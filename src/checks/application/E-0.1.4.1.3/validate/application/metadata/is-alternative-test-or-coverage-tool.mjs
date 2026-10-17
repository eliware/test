export function isAlternativeTestOrCoverageTool(name, version) {
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
