import { readFile, readdir, stat as statPath } from "node:fs/promises";
import { posix, win32 } from "node:path";
import findRepositoryEntries from "../find-repository-files.mjs";
import createRepositoryDiscovery from "./inventory/discovery.mjs";
import createRepositoryInventoryCapabilities from "./inventory/capabilities.mjs";
import createRepositoryContentCache from "./inventory/content.mjs";
export default function createRepositoryInventory(
  root,
  options = {},
  currentPlatform = process.platform,
) {
  if (typeof root !== "string" || !root.trim())
    throw new TypeError("Repository inventory root must be a non-empty path string.");
  const windowsRoot = /^(?:[A-Za-z]:[\\/]|\\\\)/u.test(root);
  if (windowsRoot && currentPlatform !== "win32")
    throw new Error("Windows repository inventory roots require a Windows host.");
  const paths = currentPlatform === "win32" ? win32 : posix;
  if (!paths.isAbsolute(root)) root = paths.resolve(root);
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
  const capabilities = createRepositoryInventoryCapabilities({
    root,
    discovery,
    focusedScope,
    statDirectory,
  });
  const content = createRepositoryContentCache(root, read, parseSource);
  return Object.freeze({
    root,
    focusedScope,
    entries: discovery.entries,
    entriesUnder: discovery.entriesUnder,
    ...capabilities,
    ...content,
  });
}
