export function hasAlternativeToolCommand(command) {
  const runners =
    "jest|vitest|mocha|ava|tap|tape|uvu|c8|nyc|istanbul|playwright|cypress|karma|jasmine|qunit|wdio|nightwatch|testcafe|protractor";
  const direct = new RegExp(`(?:^|[\\s.&|])(?:${runners}|bun\\s+test|deno\\s+test)(?=$|\\s)`, "iu");
  const packageRunner = new RegExp(
    `(?:^|[\\s.&|])(?:npx|npm\\s+exec|pnpm(?:\\s+(?:exec|dlx))?|yarn(?:\\s+(?:dlx|exec))?|bunx)(?:\\s+--[^\\s]+)*\\s+(?:--\\s+)?(?:${runners})(?=$|\\s)`,
    "iu",
  );
  return (
    direct.test(command) ||
    packageRunner.test(command) ||
    /node_modules[\\/]\.bin[\\/](?:jest|vitest|mocha|ava|tap|tape|uvu|c8|nyc|istanbul)/iu.test(
      command,
    ) ||
    /\bnode\s+(?:--[\w-]+(?:=\S+)?\s+)*--test(?=$|\s)/iu.test(command)
  );
}
