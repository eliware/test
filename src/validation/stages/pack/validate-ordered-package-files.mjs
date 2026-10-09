export function validateOrderedPackageFiles(files, requiredEntries) {
  const expected = requiredEntries.filter((entry) => entry !== ".env.example");
  if (files.some((entry) => typeof entry !== "string"))
    return "package.json.files must contain only string paths.";
  if (new Set(files).size !== files.length)
    return "package.json.files must not contain duplicate paths.";
  if (expected.some((entry, index) => files[index] !== entry))
    return `package.json.files must start with required entries in this order: ${expected.join(", ")}.`;
  if (files.includes(".env.example") && files.at(-1) !== ".env.example")
    return ".env.example must be the final package.json.files entry.";
  return null;
}
