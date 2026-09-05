import { checkEliwareRepository } from '../../../src/conventions/package-metadata/repository-policy.mjs';

const finding = (message) => ({ message });

test('requires the canonical repository for public Eliware packages', () => {
  expect(checkEliwareRepository({ name: '@eliware/demo', repository: 'https://github.com/example/demo' }, finding)[0].message).toContain('canonical repository');
});

