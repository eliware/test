import { validateCoverage } from '../../../src/public/stages/coverage.mjs';
test('passes when coverage has no gaps', async () => expect(await validateCoverage('.', '', () => {}, async () => '{}')).toBe(0));
