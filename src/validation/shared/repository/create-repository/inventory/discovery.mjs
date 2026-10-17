import { findRepositoryEntries } from "../../find-repository-files.mjs";
import { createRepositoryDirectoryReadCache } from "../directory/read/cache.mjs";
import { createRepositoryEntryReader } from "../entry/reader.mjs";
import { createRepositoryScopedEntryReader } from "../scoped-entry-reader.mjs";

export function createRepositoryDiscovery({
  root,
  findEntries = findRepositoryEntries,
  readDirectory,
  statDirectory,
  expandedDirectories = [],
  includeTestResults = false,
  includeTestResultsUnder = [],
}) {
  const readDirectoryCached = createRepositoryDirectoryReadCache(
    root,
    readDirectory,
    statDirectory,
  );
  const entryReader = createRepositoryEntryReader({
    root,
    findEntries,
    readDirectoryCached,
    includeTestResults,
    includeTestResultsUnder,
    expandedDirectories,
  });
  const { entries, hasFullDiscovery } = entryReader;
  const entriesUnder = createRepositoryScopedEntryReader({
    root,
    findEntries,
    readDirectoryCached,
    entryReader,
    includeTestResults,
    includeTestResultsUnder,
    expandedDirectories,
  });

  return {
    entries,
    entriesUnder,
    readDirectoryCached,
    hasFullDiscovery,
  };
}
