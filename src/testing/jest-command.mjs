import { resolve } from 'node:path';

export function buildJestCommand(jestPath, argumentsList, runInBand = true) {
  const jestArguments = runInBand && !argumentsList.includes('--runInBand') ? ['--runInBand', ...argumentsList] : argumentsList;
  return { command: process.execPath, argumentsList: ['--experimental-vm-modules', '--no-warnings', resolve(jestPath), ...jestArguments] };
}
