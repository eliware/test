export function findValidationCommandPair(name, commands) {
  const installs = commands.filter(({ command }) => /^npm\s+ci$/iu.test(command));
  const tests = commands.filter(({ command }) => /^npm\s+test$/iu.test(command));
  const install = installs[0];
  const commandIndex = (entry) =>
    Number.isInteger(entry?.index) ? entry.index : commands.indexOf(entry);
  const test = tests.find((entry) => commandIndex(entry) > commandIndex(install));
  if (
    installs.length !== 1 ||
    tests.length !== 1 ||
    !install ||
    !test ||
    tests.some((entry) => commandIndex(entry) < commandIndex(install)) ||
    commandIndex(install) >= commandIndex(test)
  ) {
    return {
      error: `${name} must run npm ci followed immediately by npm test.`,
    };
  }
  return { install, test, commandIndex };
}
