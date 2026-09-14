export function validateWorkflowSequence(name, commands) {
  const install = commands.findIndex(({ command }) => /^npm\s+ci$/iu.test(command));
  const test = commands.findIndex(({ command }) => /^npm\s+test$/iu.test(command));
  if (install < 0 || test < 0 || install > test) return `${name} must validate with npm ci followed by npm test.`;
  return null;
}
