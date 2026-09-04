import { validateLint } from '../../../src/public/stages/lint.mjs';
test('returns lint result code', async () => expect(await validateLint(async () => ({ code: 0 }), '.', () => {})).toBe(0));
test('falls back for incomplete results', async () => { expect(await validateLint(async () => ({ code: 2 }), '.', () => {})).toBe(2); expect(await validateLint(async () => ({}), '.', () => {})).toBe(1); });
