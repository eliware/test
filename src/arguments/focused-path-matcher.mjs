/** Return whether an argument is a concrete test file path. */
export function isFocusedTestPath(argument) {
  return typeof argument === 'string' && !argument.startsWith('-') && !/[*!?[\]{}]/.test(argument)
    && /(?:\.(?:c|m)?js|jsx|tsx|cts|mts|ts)$/i.test(argument)
    && /(?:^|[\\/])(?:tests?|spec)(?:[\\/]|$)/i.test(argument);
}
