export function scopeCheckContext(context, paths = []) {
  if (!paths.length) return context;
  const excluded = new Set(paths);
  const inventory = context.repositoryInventory;
  const scopedInventory = inventory
    ? {
        ...inventory,
        files: async (...args) =>
          (await inventory.files(...args)).filter((path) => !excluded.has(path)),
        repositoryFiles: async () =>
          (await inventory.repositoryFiles()).filter((path) => !excluded.has(path)),
        focusedFiles: async () =>
          (await inventory.focusedFiles()).filter((path) => !excluded.has(path)),
        entries: async (...args) =>
          (await inventory.entries(...args)).filter(({ path }) => !excluded.has(path)),
        entriesUnder: async (...args) =>
          (await inventory.entriesUnder(...args)).filter(({ path }) => !excluded.has(path)),
        directoryEntries: async (...args) =>
          (await inventory.directoryEntries(...args)).filter(({ path }) => !excluded.has(path)),
      }
    : inventory;
  return {
    ...context,
    repositoryInventory: scopedInventory,
    ...(context.repositoryFiles
      ? { repositoryFiles: context.repositoryFiles.filter((path) => !excluded.has(path)) }
      : {}),
    exemptPaths: paths,
    isPathExempt: (path) => excluded.has(path.replaceAll("\\", "/")),
  };
}
