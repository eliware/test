export function validateReadmeMetadata(readme, packageJson = {}) {
  if (packageJson?.publishConfig?.access === "public" && !readme.includes("npmjs.com")) {
    return "Public npm packages must include an npm version badge or npm link.";
  }
  const metadata = [
    [packageJson.description, "project description"],
    [packageJson.author?.name ?? packageJson.author, "author"],
    [packageJson.repository?.url ?? packageJson.repository, "repository"],
    [packageJson.license, "license"],
  ];
  const missingMetadata = metadata
    .filter(([value]) => value && !readme.includes(String(value)))
    .map(([, label]) => label);
  if (missingMetadata.length > 0) {
    return `README.md must state package metadata: ${missingMetadata.join(", ")}.`;
  }
  return null;
}
