import { jest } from '@jest/globals';
import { handleTestPreparation } from '../../../src/public/stages/handle-test-preparation.mjs';

test('reports a missing focused path', () => {
  const write = jest.fn();
  expect(handleTestPreparation({ missing: 'tests/missing.test.mjs' }, write)).toBe(6);
  expect(write.mock.calls[0][0]).toContain('Focused test path not found');
});

test('reports preparation cleanup errors', () => {
  const write = jest.fn();
  expect(handleTestPreparation({ cleanupError: new Error('locked') }, write)).toBe(7);
  expect(write.mock.calls[0][0]).toContain('Coverage cleanup failed');
});

test('accepts successful preparation', () => {
  expect(handleTestPreparation({}, () => {})).toBeNull();
});
