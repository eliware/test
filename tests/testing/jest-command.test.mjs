import { buildJestCommand } from '../../src/testing/jest-command.mjs';
test('builds node jest command', () => expect(buildJestCommand('node_modules/jest/bin/jest.js', [])).toMatchObject({ command: process.execPath, argumentsList: expect.arrayContaining(['--runInBand']) }));
test('preserves explicit in-band and diagnostic opt-out modes', () => {
  expect(buildJestCommand('jest.js', ['--runInBand'])).toMatchObject({ argumentsList: expect.arrayContaining(['--runInBand']) });
  expect(buildJestCommand('jest.js', [], false).argumentsList).not.toContain('--runInBand');
});
