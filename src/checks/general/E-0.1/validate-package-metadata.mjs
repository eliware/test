function nonempty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validAuthor(author) {
  return nonempty(author) || (author && typeof author === "object" && nonempty(author.name));
}

export function validatePackageMetadata(packageJson) {
  if (!nonempty(packageJson.description) || !validAuthor(packageJson.author))
    return "package.json must contain nonempty description and author metadata.";
  if (
    packageJson.license !== "MIT" ||
    !Array.isArray(packageJson.keywords) ||
    packageJson.keywords.length === 0 ||
    packageJson.keywords.some((keyword) => !nonempty(keyword))
  ) return "package.json must use the MIT license and declare nonempty string keywords.";
  const repository = packageJson.repository;
  if (!(
    nonempty(repository) ||
    (repository && typeof repository === "object" && nonempty(repository.url))
  )) return "package.json.repository must identify a nonempty repository URL.";
  return null;
}
