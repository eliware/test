export function isManagedArgument(argument, managedOptions) {
  return managedOptions.some((name) => argument === name || argument.startsWith(`${name}=`));
}

export function isWrapperArgument(argument) {
  return ['--lint', '--ignore-100x4', '--ignore-monolith-limits', '--runInBand', '--no-runInBand', '--sanitize-env'].includes(argument);
}
