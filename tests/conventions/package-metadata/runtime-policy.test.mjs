import { checkRuntimeMetadata } from '../../../src/conventions/package-metadata/runtime-policy.mjs';

const finding = (message) => ({ message });

test('requires a Node engine for publishable packages', () => {
  expect(checkRuntimeMetadata({ private: false, engines: {} }, finding)[0].message).toContain('engines.node');
});

