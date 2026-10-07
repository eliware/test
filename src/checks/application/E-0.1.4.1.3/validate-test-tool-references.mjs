import { detectTestToolUse } from "./detect-test-tool-use.mjs";

const forbiddenToolReference =
  /["'`](@jest\/(?!globals(?:["'/]))[^"'`]+|@vitest\/[^"'`]+|@tapjs\/[^"'`]+|@wdio\/[^"'`]+|@cypress\/[^"'`]+|jest(?:-[^/"'`]+)?(?:\/[^"'`]*)?|vitest(?:\/[^"'`]*)?|mocha(?:\/[^"'`]*)?|ava|tap|tape|uvu|c8|nyc|istanbul|babel-plugin-istanbul|node:test|playwright|@playwright\/test|cypress|jasmine|@bcoe\/v8-coverage)["'`]/giu;
const forbiddenToolCommand =
  /(?:^|[\s/\\"'`])(?:jest|vitest|mocha|ava|tap|tape|uvu|c8|nyc|istanbul|playwright|cypress|karma|jasmine|qunit|wdio|nightwatch|testcafe|protractor)(?:\.cmd)?(?:[\\/"'`]|\s|$)|\bnode(?:\.exe)?\s+(?:--[\w-]+(?:=\S+)?\s+)*--test(?=$|[\s"'`])|\b(?:bun|deno)\s+test(?:\s|$)/iu;
const forbiddenAlternativeReference =
  /["'`](@vitest\/[^"'`]+|@tapjs\/[^"'`]+|@wdio\/[^"'`]+|@cypress\/[^"'`]+|vitest(?:\/[^"'`]*)?|mocha(?:\/[^"'`]*)?|ava|tap|tape|uvu|c8|nyc|istanbul|babel-plugin-istanbul|node:test|playwright|@playwright\/test|cypress|jasmine|@bcoe\/v8-coverage)["'`]/giu;
const forbiddenAlternativeCommand =
  /(?:^|[\s/\\"'`])(?:vitest|mocha|ava|tap|tape|uvu|c8|nyc|istanbul|playwright|cypress|karma|jasmine|qunit|wdio|nightwatch|testcafe|protractor)(?:\.cmd)?(?:[\\/"'`]|\s|$)|\bnode(?:\.exe)?\s+(?:--[\w-]+(?:=\S+)?\s+)*--test(?=$|[\s"'`])|\b(?:bun|deno)\s+test(?:\s|$)/iu;

export function validateTestToolReferences(path, content, harness = false) {
  const plainText =
    path === "package.json" ||
    /\.(?:json|ya?ml|sh|ps1|py)$/iu.test(path) ||
    !/\.(?:mjs|js|cjs|jsx|ts|tsx|cts|mts|mjsx|cjsx)$/iu.test(path);
  const referencesTool = plainText
    ? harness
      ? forbiddenAlternativeReference.test(content) || forbiddenAlternativeCommand.test(content)
      : forbiddenToolReference.test(content) || forbiddenToolCommand.test(content)
    : detectTestToolUse(content, harness);
  for (const pattern of [
    forbiddenToolReference,
    forbiddenToolCommand,
    forbiddenAlternativeReference,
    forbiddenAlternativeCommand,
  ])
    pattern.lastIndex = 0;
  return referencesTool
    ? `${path} must not import or invoke a test runner or coverage tool.`
    : null;
}
