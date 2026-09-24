import { validateReadmeDocumentationNavigation } from "./validate-readme-documentation-navigation.mjs";
import { validateReadmeLicense } from "./validate-readme-license.mjs";
import { validateReadmeLinks } from "./validate-readme-links.mjs";
import { validateReadmePackageBadges } from "./validate-readme-package-badges.mjs";
import { validateReadmeProfileContent } from "./validate-readme-profile-content.mjs";
import { validateReadmeStructure } from "./validate-readme-structure.mjs";
import { validateReadmeSupport } from "./validate-readme-support.mjs";

export function validateReadmeRequiredContent(readme, packageJson = {}, options = {}) {
  const validations = [
    () => validateReadmeStructure(readme, packageJson),
    () => validateReadmePackageBadges(readme, packageJson),
    () => validateReadmeProfileContent(readme, packageJson),
    () => validateReadmeDocumentationNavigation(readme, options),
    () => validateReadmeSupport(readme),
    () => validateReadmeLinks(readme, packageJson),
    () => validateReadmeLicense(readme),
  ];
  for (const validate of validations) {
    const error = validate();
    if (error) return error;
  }
  return null;
}
