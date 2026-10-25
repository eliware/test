import { validatePrettierIgnorePolicy } from "./prettier/ignore-policy.mjs";

export async function validateStandalonePrettierConfiguration(repositoryInventory, root, runGit) {
  if (!repositoryInventory?.files) return [];
  try {
    const files = await repositoryInventory.files("all");
    const configs = files.filter((file) =>
      /(?:^|\/)(?:\.editorconfig|\.prettierrc(?:\..+)?|prettier\.config(?:\..+)?)$/iu.test(file),
    );
    const errors = configs.length
      ? [`Standalone Prettier configuration files are not allowed: ${configs.join(", ")}.`]
      : [];
    return [
      ...errors,
      ...(await validatePrettierIgnorePolicy(repositoryInventory, files, root, runGit)),
    ];
  } catch (error) {
    return [`Prettier configuration files could not be inspected: ${error.message}`];
  }
}
