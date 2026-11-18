import createRepositoryFileViews from "./views.mjs";
import createDocumentationFileView from "./documentation.mjs";
import createRepositoryDirectoryEntries from "../directory/entries.mjs";
export default function createRepositoryInventoryCapabilities({
  root,
  discovery,
  focusedScope,
  statDirectory,
}) {
  const fileViews = createRepositoryFileViews(discovery.entries, focusedScope, root);
  return {
    ...fileViews,
    documentationFiles: createDocumentationFileView(root, discovery.entriesUnder),
    directoryEntries: createRepositoryDirectoryEntries({
      root,
      entries: discovery.entries,
      entriesUnder: discovery.entriesUnder,
      readDirectory: discovery.readDirectoryCached,
      statDirectory,
      hasFullDiscovery: discovery.hasFullDiscovery,
    }),
  };
}
