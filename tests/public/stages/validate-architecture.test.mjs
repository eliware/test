import { jest } from '@jest/globals';
import { validateArchitecture } from '../../../src/public/stages/validate-architecture.mjs';

test('returns success for an exact mapping', async () => {
  await expect(validateArchitecture('repo', () => {}, async () => ({ missingTests: [], orphanTests: [] }))).resolves.toBe(0);
});

test('uses the default mapping checker', async () => {
  await expect(validateArchitecture(process.cwd(), () => {})).resolves.toBe(0);
});

test('reports mapping drift and returns a non-zero code', async () => {
  const write = jest.fn();
  await expect(validateArchitecture('repo', write, async () => ({ missingTests: ['a'], orphanTests: ['b'] }))).resolves.toBe(16);
  expect(write.mock.calls[0][0]).toContain('Missing test pair');
  expect(write.mock.calls[0][0]).toContain('Test without source pair');
});

test('reports checker failures as workspace setup errors', async () => {
  const write = jest.fn();
  await expect(validateArchitecture('repo', write, async () => { throw new Error('unreadable'); })).resolves.toBe(2);
  expect(write.mock.calls[0][0]).toContain('unreadable');
});

test('reports malformed checker results as workspace setup errors', async () => {
  const write = jest.fn();
  await expect(validateArchitecture('repo', write, async () => ({ missingTests: null }))).resolves.toBe(2);
  expect(write.mock.calls[0][0]).toContain('invalid result');
});
