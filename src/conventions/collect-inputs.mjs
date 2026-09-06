import { readFile, readdir } from 'node:fs/promises';
import { findMissingRequiredPaths } from './required-paths.mjs';
import { readConventionPackage } from './read-package.mjs';
import { collectFileInputs } from './collect-file-inputs.mjs';
import { collectDocumentInputs } from './collect-document-inputs.mjs';
import { createConventionReaders } from './create-convention-readers.mjs';

export async function collectConventionInputs({ cwd, accessPath, readFilePath = readFile, readDirectory = readdir, exceptions = [] }) {
  const { cachedReadFile, read, readDirectoryOnce } = createConventionReaders(cwd, readFilePath, readDirectory);
  const packageJson = await readConventionPackage(cwd, cachedReadFile);
  const configuredExceptions = Array.isArray(packageJson?.eliwareTest?.conventions?.exceptions) ? packageJson.eliwareTest.conventions.exceptions.filter((value) => typeof value === 'string') : exceptions;
  const findings = (await findMissingRequiredPaths(cwd, accessPath, configuredExceptions)).map((path) => ({ group: 'structure', message: `missing required path: ${path}` }));
  const fileInputs = await collectFileInputs(cwd, readDirectoryOnce);
  const documentInputs = await collectDocumentInputs({ cwd, read, readDirectoryOnce, ...fileInputs });
  return { packageJson, exceptions: configuredExceptions, findings, read, paths: fileInputs.paths, files: fileInputs.files, ...fileInputs, ...documentInputs };
}
