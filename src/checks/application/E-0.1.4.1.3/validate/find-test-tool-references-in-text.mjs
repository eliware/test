const forbiddenToolReference =
  /["'`](@jest\/(?!globals(?:["'/]))[^"'`]+|@vitest\/[^"'`]+|@tapjs\/[^"'`]+|@wdio\/[^"'`]+|@cypress\/[^"'`]+|jest(?:-[^/"'`]+)?(?:\/[^"'`]*)?|vitest(?:\/[^"'`]*)?|mocha(?:\/[^"'`]*)?|ava|tap|tape|uvu|c8|nyc|istanbul|babel-plugin-istanbul|node:test|playwright|@playwright\/test|cypress|jasmine|@bcoe\/v8-coverage)["'`]/giu;
const forbiddenToolCommand =
  /(?:^|[\s/\\"'`])(?:jest|vitest|mocha|ava|tap|tape|uvu|c8|nyc|istanbul|playwright|cypress|karma|jasmine|qunit|wdio|nightwatch|testcafe|protractor)(?:\.cmd)?(?:[\\/"'`]|\s|$)|\bnode(?:\.exe)?\s+(?:--[\w-]+(?:=\S+)?\s+)*--test(?=$|[\s"'`])|\b(?:bun|deno)\s+test(?:\s|$)/iu;
const forbiddenAlternativeReference =
  /["'`](@vitest\/[^"'`]+|@tapjs\/[^"'`]+|@wdio\/[^"'`]+|@cypress\/[^"'`]+|vitest(?:\/[^"'`]*)?|mocha(?:\/[^"'`]*)?|ava|tap|tape|uvu|c8|nyc|istanbul|babel-plugin-istanbul|node:test|playwright|@playwright\/test|cypress|jasmine|@bcoe\/v8-coverage)["'`]/giu;
const forbiddenAlternativeCommand =
  /(?:^|[\s/\\"'`])(?:vitest|mocha|ava|tap|tape|uvu|c8|nyc|istanbul|playwright|cypress|karma|jasmine|qunit|wdio|nightwatch|testcafe|protractor)(?:\.cmd)?(?:[\\/"'`]|\s|$)|\bnode(?:\.exe)?\s+(?:--[\w-]+(?:=\S+)?\s+)*--test(?=$|[\s"'`])|\b(?:bun|deno)\s+test(?:\s|$)/iu;

export function findTestToolReferencesInText(content, harness = false) {
  const referencePattern = harness ? forbiddenAlternativeReference : forbiddenToolReference;
  const commandPattern = harness ? forbiddenAlternativeCommand : forbiddenToolCommand;
  try {
    return referencePattern.test(content) || commandPattern.test(content);
  } finally {
    referencePattern.lastIndex = 0;
    commandPattern.lastIndex = 0;
  }
}
