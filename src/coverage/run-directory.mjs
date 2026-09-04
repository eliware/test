import { access, mkdir, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

export const TEMP_COVERAGE_DIRECTORY = '.eliware-test-coverage';

async function removePrevious(removePath, previousPath, reportCleanupError) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try { await removePath(previousPath, { recursive: true, force: true }); return true; }
    catch (error) { lastError = error; }
  }
  reportCleanupError?.(lastError);
  return false;
}

export async function prepareCoverageDirectory(cwd, removePath = rm, mkdirPath = mkdir) {
  const temporaryPath = resolve(cwd, TEMP_COVERAGE_DIRECTORY);
  await removePath(temporaryPath, { recursive: true, force: true });
  await mkdirPath(temporaryPath, { recursive: true });
  return temporaryPath;
}

export async function promoteCoverageDirectory(cwd, temporaryPath, accessPath = access, removePath = rm, renamePath = rename, reportCleanupError) {
  try { await accessPath(temporaryPath); }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
  const destination = resolve(cwd, 'coverage');
  const previousPath = `${destination}.previous`;
  await removePrevious(removePath, previousPath, reportCleanupError);
  try { await renamePath(destination, previousPath); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  try { await renamePath(temporaryPath, destination); }
  catch (error) {
    try { await renamePath(previousPath, destination); } catch {}
    throw error;
  }
  await removePrevious(removePath, previousPath);
  return true;
}
