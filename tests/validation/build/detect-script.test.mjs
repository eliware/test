import { detectBuildScript } from '../../../src/validation/build/detect-script.mjs';

test('reads the configured build script', async () => {
  const readFile = async () => JSON.stringify({ scripts: { build: 'node build.mjs' } });
  await expect(detectBuildScript('C:/repo', readFile)).resolves.toBe('node build.mjs');
});
