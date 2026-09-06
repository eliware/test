import { checkBasicPackageFields } from '../../../src/conventions/package-metadata/basic-fields.mjs';

test('accepts valid basic metadata and rejects malformed fields', () => {
  expect(checkBasicPackageFields({ name: 'x', version: '1.0.0', description: 'x', author: 'x', license: 'MIT', keywords: ['x'], repository: 'https://example.com', homepage: 'https://example.com' })).toEqual([]);
  expect(checkBasicPackageFields({ keywords: [''] }).length).toBeGreaterThan(0);
});
