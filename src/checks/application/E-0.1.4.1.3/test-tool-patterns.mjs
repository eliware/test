const toolName =
  /^(?:@jest\/(?!globals$)[^/]+|@vitest\/|@tapjs\/|@wdio\/|@cypress\/|@istanbuljs\/|jest(?:-|$)|vitest(?:\/|$)|mocha(?:\/|$)|ava$|tap$|tape$|uvu$|c8$|nyc$|istanbul(?:-|$)|babel-plugin-istanbul$|node:test$|playwright$|@playwright\/|cypress$|jasmine$|@bcoe\/v8-coverage$)/iu;
const commandName =
  /(?:^|[\s/\\])(?:jest|vitest|mocha|ava|tap|tape|uvu|c8|nyc|istanbul|playwright|cypress|karma|jasmine|qunit|wdio|nightwatch|testcafe|protractor)(?:\.cmd)?(?:[\s/\\]|$)|\bnode(?:\.exe)?\s+(?:--[\w-]+(?:=\S+)?\s+)*--test(?=$|\s)|\b(?:bun|deno)\s+test(?:\s|$)/iu;

export function isTestToolSpecifier(value) {
  return toolName.test(value);
}

export function isTestToolCommand(value) {
  return commandName.test(value);
}
