import validatePrettierConfigurationFiles from "./prettier/configuration-files.mjs";
export default function validateStandalonePrettierConfiguration(repositoryInventory, root, runGit) {
  return validatePrettierConfigurationFiles(repositoryInventory, root, runGit);
}
