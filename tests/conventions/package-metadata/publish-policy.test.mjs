import { checkPublishMetadata } from '../../../src/conventions/package-metadata/publish-policy.mjs';

const finding = (message) => ({ message });

test('requires npm provenance for publishable packages', () => {
  expect(checkPublishMetadata({ private: false, publishConfig: { access: 'public' } }, finding)[0].message).toContain('publishConfig.provenance');
});

