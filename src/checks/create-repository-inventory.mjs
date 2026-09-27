import { readFile, readdir } from "node:fs/promises";
import { findRepositoryEntries } from "./general/E-0.1/find-repository-files.mjs";
import { createRepositoryDiscovery } from "./create-repository-inventory-discovery.mjs";
import { createRepositoryFileViews } from "./create-repository-inventory-views.mjs";
import { createRepositoryContentCache } from "./create-repository-inventory-content.mjs";
import { createDocumentationFileView } from "./create-repository-inventory-documentation.mjs";
import { createRepositoryDirectoryEntries } from "./create-repository-directory-entries.mjs";

export function createRepositoryInventory(root, options = {}) {
  const {
    focusedScope = null,
    findEntries = findRepositoryEntries,
    expandedDirectories = [],
    includeTestResults = false,
    includeTestResultsUnder = [],
    read = readFile,
    readDirectory = readdir,
    parseSource,
  } = options;
  const discovery = createRepositoryDiscovery({
    root,
    findEntries,
    readDirectory,
    expandedDirectories,
    includeTestResults,
    includeTestResultsUnder,
  });
  const views = createRepositoryFileViews(discovery.entries, focusedScope);
  const content = createRepositoryContentCache(root, read, parseSource);
  const documentationFiles = createDocumentationFileView(root, discovery.entriesUnder);
  const directoryEntries = createRepositoryDirectoryEntries({
    root,
    entries: discovery.entries,
    entriesUnder: discovery.entriesUnder,
    readDirectory: discovery.readDirectoryCached,
    hasFullDiscovery: discovery.hasFullDiscovery,
  });

  return Object.freeze({
    root,
    focusedScope,
    entries: discovery.entries,
    entriesUnder: discovery.entriesUnder,
    directoryEntries,
    ...views,
    documentationFiles,
    ...content,
  });
}
