import { readFile, readdir, stat as statPath } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { findRepositoryEntries } from "./general/E-0.1/find-repository-files.mjs";
import { createRepositoryDiscovery } from "./create-repository-inventory-discovery.mjs";
import { createRepositoryFileViews } from "./create-repository-inventory-views.mjs";
import { createRepositoryContentCache } from "./create-repository-inventory-content.mjs";
import { createDocumentationFileView } from "./create-repository-inventory-documentation.mjs";
import { createRepositoryDirectoryEntries } from "./create-repository-directory-entries.mjs";

export function createRepositoryInventory(root, options = {}, currentPlatform = process.platform) {
  if (typeof root !== "string" || !root.trim())
    throw new TypeError("Repository inventory root must be a non-empty path string.");
  // The two-leading-backslash branch includes UNC and Windows device namespaces.
  const windowsRoot = /^(?:[A-Za-z]:[\\/]|\\\\)/u.test(root);
  if (windowsRoot && currentPlatform !== "win32")
    throw new Error("Windows repository inventory roots require a Windows host.");
  if (!isAbsolute(root)) root = resolve(root);
  const {
    focusedScope = null,
    findEntries = findRepositoryEntries,
    expandedDirectories = [],
    includeTestResults = false,
    includeTestResultsUnder = [],
    read = readFile,
    readDirectory = readdir,
    statDirectory = statPath,
    parseSource,
  } = options;
  const discovery = createRepositoryDiscovery({
    root,
    findEntries,
    readDirectory,
    statDirectory,
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
    statDirectory,
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
