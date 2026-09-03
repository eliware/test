import { configuredScript } from '../../../src/runner/workspace/stage.mjs';
test('reads configured scripts', async () => { await expect(configuredScript('C:/repo', 'build', async () => '{"scripts":{"build":"npm run compile"}}')).resolves.toBe('npm run compile'); });
