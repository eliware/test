import { VALUE_OPTIONS } from '../../arguments.mjs';
export function isTestPath(argument) { return !argument.startsWith('-') && !/[*!?[\]{}]/.test(argument) && /(?:\.(?:c|m)?js|jsx|tsx|cts|mts|ts)$/i.test(argument) && /(?:^|[\\/])(?:tests?|spec)(?:[\\/]|$)/i.test(argument); }
export function positionalArguments(argumentsList) {
  const values = [];
  const valueOptions = new Set(VALUE_OPTIONS);
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (valueOptions.has(argument)) { if (index + 1 >= argumentsList.length) throw new Error(`${argument} requires a value.`); index += 1; continue; }
    if (!argument.startsWith('-')) values.push(argument);
  }
  return values;
}
