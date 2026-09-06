import { checkPublishablePackageFields } from '../../../src/conventions/package-metadata/publish-fields.mjs';

test('skips private packages and checks publishable package fields', () => {
  expect(checkPublishablePackageFields({ private: true })).toEqual([]);
  expect(checkPublishablePackageFields({ private: false })).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('repository') })]));
  expect(checkPublishablePackageFields({ private: false, repository: 'x', homepage: 'x', files: ['README.md', 'LICENSE', 'RELEASE_NOTES.md'], publishConfig: {} })).toEqual([]);
});
