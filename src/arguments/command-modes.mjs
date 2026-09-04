export function terminalMode(argumentsList) {
  if (argumentsList.includes('--version') || argumentsList.includes('-v')) return { version: true, lint: false, runnerArguments: [] };
  if (argumentsList.includes('--help') || argumentsList.includes('-h')) return { help: true, lint: false, runnerArguments: [] };
  return null;
}
