import { detectTypecheckScript } from '../../../src/validation/typecheck/detect-script.mjs';

test('reads the configured typecheck script', async () => {
  const readFile = async () => JSON.stringify({ scripts: { typecheck: 'tsc --noEmit' } });
  await expect(detectTypecheckScript('C:/repo', readFile)).resolves.toBe('tsc --noEmit');
});
