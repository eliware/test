import { matchesRepositoryPathPattern } from "./matches-repository-path-pattern.mjs";

export function scopeCheckContext(context, paths = []) {
  if (!paths.length) return context;
  const isExcluded = (path) => paths.some((pattern) => matchesRepositoryPathPattern(pattern, path));
  const inventory = context.repositoryInventory;
  const scopedInventory = inventory
    ? {
        ...inventory,
        files: async (...args) =>
          (await inventory.files(...args)).filter((path) => !isExcluded(path)),
        repositoryFiles: async () =>
          (await inventory.repositoryFiles()).filter((path) => !isExcluded(path)),
        focusedFiles: async () =>
          (await inventory.focusedFiles()).filter((path) => !isExcluded(path)),
        entries: async (...args) =>
          (await inventory.entries(...args)).filter(({ path }) => !isExcluded(path)),
        entriesUnder: async (...args) =>
          (await inventory.entriesUnder(...args)).filter(({ path }) => !isExcluded(path)),
        directoryEntries: async (...args) =>
          (await inventory.directoryEntries(...args)).filter(({ path }) => !isExcluded(path)),
      }
    : inventory;
  return {
    ...context,
    repositoryInventory: scopedInventory,
    ...(context.repositoryFiles
      ? { repositoryFiles: context.repositoryFiles.filter((path) => !isExcluded(path)) }
      : {}),
    exemptPaths: paths,
    isPathExempt: isExcluded,
  };
}
