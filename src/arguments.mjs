export function parseArguments(argumentsList = []) {
  const lint = argumentsList.includes('--lint');
  return { lint, runnerArguments: argumentsList.filter((argument) => argument !== '--lint') };
}
