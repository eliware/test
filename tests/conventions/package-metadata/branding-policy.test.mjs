import { checkEliwareBranding } from '../../../src/conventions/package-metadata/branding-policy.mjs';

const finding = (message) => ({ message });

test('requires Eliware as the author for public Eliware packages', () => {
  expect(checkEliwareBranding({ name: '@eliware/demo', author: 'Other' }, finding)[0].message).toContain('Eliware <eliware@eliware.org>');
});

test('requires the exact canonical public author identity', () => {
  expect(checkEliwareBranding({ name: '@eliware/demo', author: 'Eliware' }, finding)[0].message).toContain('Eliware <eliware@eliware.org>');
  expect(checkEliwareBranding({ name: '@eliware/demo', author: 'Eliware <eliware@eliware.org>' }, finding)).toEqual([]);
});
