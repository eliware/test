import { access, mkdir, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

export const TEMP_COVERAGE_DIRECTORY = '.eliware-test-coverage';

export async function prepareCoverageDirectory(cwd, removePath = rm, mkdirPath = mkdir) {
  const temporaryPath = resolve(cwd, TEMP_COVERAGE_DIRECTORY);
  await removePath(temporaryPath, { recursive: true, force: true });
  await mkdirPath(temporaryPath, { recursive: true });
  return temporaryPath;
}

export async function promoteCoverageDirectory(cwd, temporaryPath, accessPath = access, removePath = rm, renamePath = rename) {
  try { await accessPath(temporaryPath); }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
  const destination = resolve(cwd, 'coverage');
  const previous = resolve(cwd, '.eliware-test-coverage-previous');
  let hadDestination = true;
  try { await accessPath(destination); } catch (error) { if (error.code === 'ENOENT') hadDestination = false; else throw error; }
  if (hadDestination) await renamePath(destination, previous);
  try {
    await renamePath(temporaryPath, destination);
  } catch (error) {
    if (hadDestination) {
      try { await renamePath(previous, destination); } catch { /* preserve the original promotion error */ }
    }
    throw error;
  }
  if (hadDestination) await removePath(previous, { recursive: true, force: true });
  return true;
}
