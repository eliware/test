import { readSection } from "./read-readme-section.mjs";
import { normalizeRepositoryUrl } from "./validate-readme-links.mjs";

export function validateReadmeMetadata(readme, packageJson = {}, sections) {
  if (packageJson.eliware?.apply?.includes("npm-published")) {
    if (!readme.includes("npmjs.com")) {
      return "Public npm packages must include an npm version badge or npm link.";
    }
  }
  const author =
    typeof packageJson.author === "string"
      ? packageJson.author
      : packageJson.author && packageJson.author.name;
  const repository =
    typeof packageJson.repository === "string"
      ? packageJson.repository
      : packageJson.repository?.url;
  const metadata = [
    [packageJson.description, "project description"],
    [author, "author"],
    [repository, "repository URL"],
    [packageJson.license, "license"],
  ];
  const missingMetadata = metadata
    .filter(([value]) => typeof value !== "string" || !value.trim())
    .map(([, label]) => label);
  if (missingMetadata.length > 0) {
    return `package.json must contain valid README metadata: ${missingMetadata.join(", ")}.`;
  }
  const missingValues = metadata
    .filter(([value]) => !readme.includes(value))
    .map(([, label]) => label);
  if (missingValues.length > 0)
    return `README.md must state exact package metadata: ${missingValues.join(", ")}.`;
  const canonicalRepositoryUrl = normalizeRepositoryUrl(repository);
  if (
    !canonicalRepositoryUrl ||
    !readSection(readme, "Links", sections).includes(`](${canonicalRepositoryUrl})`.toLowerCase())
  )
    return "README.md Links section must link the package.json repository URL in canonical HTTPS form.";
  return null;
}
