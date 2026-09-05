import { checkEliwareBranding } from '../../../src/conventions/package-metadata/branding-policy.mjs';

const finding = (message) => ({ message });

test('requires Eliware as the author for public Eliware packages', () => {
  expect(checkEliwareBranding({ name: '@eliware/demo', author: 'Other' }, finding)[0].message).toContain('identify Eliware');
});

