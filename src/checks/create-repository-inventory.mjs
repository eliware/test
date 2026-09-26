import { readFile, readdir } from "node:fs/promises";
import { findRepositoryEntries } from "./general/E-0.1/find-repository-files.mjs";
import { createRepositoryDiscovery } from "./create-repository-inventory-discovery.mjs";
import { createRepositoryFileViews } from "./create-repository-inventory-views.mjs";
import { createRepositoryContentCache } from "./create-repository-inventory-content.mjs";
import { createDocumentationFileView } from "./create-repository-inventory-documentation.mjs";

export function createRepositoryInventory(root, options = {}) {
  const {
    mode = null,
    modeRuleId = null,
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

  return Object.freeze({
    root,
    mode,
    modeRuleId,
    focusedScope,
    ...discovery,
    ...views,
    documentationFiles,
    ...content,
  });
}
