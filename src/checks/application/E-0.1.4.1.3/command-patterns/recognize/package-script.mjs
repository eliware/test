export const testToolRunners = Object.freeze([
  "jest",
  "vitest",
  "mocha",
  "ava",
  "tap",
  "tape",
  "uvu",
  "c8",
  "nyc",
  "istanbul",
  "playwright",
  "cypress",
  "karma",
  "jasmine",
  "qunit",
  "wdio",
  "nightwatch",
  "testcafe",
  "protractor",
]);

const runnerPattern = testToolRunners.join("|");

export function hasAlternativePackageScriptCommand(command) {
  const direct = new RegExp(
    `(?:^|[\\s.&|])(?:${runnerPattern}|bun\\s+test|deno\\s+test)(?=$|\\s)`,
    "iu",
  );
  const packageRunner = new RegExp(
    `(?:^|[\\s.&|])(?:npx|npm\\s+exec|pnpm(?:\\s+(?:exec|dlx))?|yarn(?:\\s+(?:dlx|exec))?|bunx)(?:\\s+--[^\\s]+)*\\s+(?:--\\s+)?(?:${runnerPattern})(?=$|\\s)`,
    "iu",
  );
  const localRunner = new RegExp(
    `node_modules[\\\\/]\\.bin[\\\\/](?:${testToolRunners.slice(0, 10).join("|")})`,
    "iu",
  );
  return (
    direct.test(command) ||
    packageRunner.test(command) ||
    localRunner.test(command) ||
    /\bnode\s+(?:--[\w-]+(?:=\S+)?\s+)*--test(?=$|\s)/iu.test(command)
  );
}
