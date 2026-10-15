export function validateOrderedPackageFiles(files, requiredEntries) {
  if (files.some((entry) => typeof entry !== "string"))
    return "package.json.files must contain only string paths.";
  if (new Set(files).size !== files.length)
    return "package.json.files must not contain duplicate paths.";
  if (requiredEntries.some((entry, index) => files[index] !== entry))
    return `package.json.files must start with required entries in this order: ${requiredEntries.join(", ")}.`;
  return null;
}
