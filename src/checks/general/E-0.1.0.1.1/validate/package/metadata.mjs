import { validatePackageIdentity } from "./identity.mjs";
import { validatePackageVersion } from "./version.mjs";

const nonempty = (value) => typeof value === "string" && value.trim().length > 0;

export function validatePackageMetadata(packageJson) {
  const errors = [...validatePackageIdentity(packageJson), ...validatePackageVersion(packageJson)];
  if (!nonempty(packageJson?.description))
    errors.push("package.json.description must be nonempty.");
  const keywords = packageJson?.keywords;
  if (
    !Array.isArray(keywords) ||
    keywords.length === 0 ||
    keywords.some((word) => !nonempty(word))
  ) {
    errors.push("package.json.keywords must contain nonempty strings.");
  } else if (new Set(keywords).size !== keywords.length) {
    errors.push("package.json.keywords must be distinct.");
  }
  if (Array.isArray(keywords) && keywords.length > 20)
    errors.push("package.json.keywords must contain no more than 20 entries.");
  if (typeof packageJson?.private !== "boolean")
    errors.push("package.json.private must be boolean.");
  if (packageJson?.license !== "MIT") errors.push('package.json.license must be "MIT".');
  if (packageJson?.type !== "module") errors.push('package.json.type must be "module".');
  if (packageJson?.engines?.node !== ">=26")
    errors.push('package.json.engines.node must be ">=26".');
  return errors;
}
