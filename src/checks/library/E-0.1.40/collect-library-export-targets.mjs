export function collectLibraryExportTargets(value, targets = []) {
  if (typeof value === "string") targets.push(value);
  else if (Array.isArray(value)) value.forEach((entry) => collectLibraryExportTargets(entry, targets));
  else if (value && typeof value === "object") {
    Object.values(value).forEach((entry) => collectLibraryExportTargets(entry, targets));
  }
  return targets;
}
