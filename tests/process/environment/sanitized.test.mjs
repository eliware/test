import { childEnvironment } from '../../../src/process/environment/sanitized.mjs';
test('merges explicit child variables', () => { expect(childEnvironment({ env: { SAFE: 'yes' } }, () => ({ BASE: 'ok' }))).toEqual({ BASE: 'ok', SAFE: 'yes' }); });
