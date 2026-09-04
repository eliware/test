import { mapPathsToSources } from './map-paths-to-sources.mjs';
import { selectSourceFiles } from './select-source-files.mjs';
import { coverageArguments } from './coverage-arguments.mjs';

/** Resolve focused tests into Jest's scoped coverage arguments. */
export async function resolveFocusedCoverage(cwd, testPaths, accessPath) {
  const mappedPaths = await mapPathsToSources(cwd, testPaths, accessPath);
  const sourceFiles = selectSourceFiles(mappedPaths);
  if (sourceFiles.length === 0) return [];
  return coverageArguments(sourceFiles);
}
