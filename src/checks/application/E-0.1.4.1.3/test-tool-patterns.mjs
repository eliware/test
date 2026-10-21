const toolSpecifier =
  /^(?:@jest\/(?!globals$)[^/]+|@vitest\/|@tapjs\/|@wdio\/|@cypress\/|@istanbuljs\/|jest(?:-|$)|vitest(?:\/|$)|mocha(?:\/|$)|ava$|tap$|tape$|uvu$|c8$|nyc$|istanbul(?:-|$)|babel-plugin-istanbul$|node:test$|playwright$|@playwright\/|cypress$|jasmine$|@bcoe\/v8-coverage$)/iu;

export function isTestToolSpecifier(value) {
  return toolSpecifier.test(value);
}
