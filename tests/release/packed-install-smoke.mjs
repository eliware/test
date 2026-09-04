import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

const packageManager = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const execute = async (cwd, args) => run(packageManager, args, {
  cwd, windowsHide: true, shell: process.platform === 'win32', maxBuffer: 2 * 1024 * 1024,
  env: { ...process.env, npm_config_ignore_scripts: 'true', npm_config_allow_scripts: '' }
});

const workspace = await mkdtemp(join(tmpdir(), 'eliware-test-pack-'));
try {
  const { stdout } = await execute(process.cwd(), ['pack', '--json', '--ignore-scripts']);
  const packed = JSON.parse(stdout);
  const tarball = (Array.isArray(packed) ? packed[0] : Object.values(packed)[0])?.filename;
  if (!tarball) throw new Error('npm pack did not produce a tarball');
  const archive = join(process.cwd(), tarball);
  await writeFile(join(workspace, 'package.json'), JSON.stringify({ type: 'module', allowScripts: { '@eliware/test': true }, scripts: { test: 'eliware-test', lint: 'eliware-test --lint' } }));
  await writeFile(join(workspace, '.npmrc'), 'ignore-scripts=true\nallow-scripts=*\n');
  await writeFile(join(workspace, 'smoke.test.mjs'), 'test("packaged runtime", () => expect(true).toBe(true));\n');
  await execute(workspace, ['install', '--no-audit', '--no-fund', archive]);
  const bin = join(workspace, 'node_modules', '@eliware', 'test', 'bin', 'eliware-test.mjs');
  await run(process.execPath, [bin, '--version'], { cwd: workspace, windowsHide: true });
  await run(process.execPath, [bin], { cwd: workspace, windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
  await run(process.execPath, [bin, '--lint'], { cwd: workspace, windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
} finally {
  await rm(workspace, { recursive: true, force: true });
}
