import { rejectManagedArguments } from '../../src/arguments/reject-managed-arguments.mjs';

test('accepts ordinary Jest arguments', () => {
  expect(() => rejectManagedArguments(['--runInBand'])).not.toThrow();
});

test('rejects managed arguments', () => {
  expect(() => rejectManagedArguments(['--coverage'])).toThrow('managed by eliware-test');
});
