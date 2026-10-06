import { minimatch } from "minimatch";

const maintainedExtensions = new Set([".mjs", ".json", ".yml", ".yaml", ".md"]);

export async function validateStandalonePrettierConfiguration(repositoryInventory) {
  if (!repositoryInventory?.files) return [];
  try {
    const files = await repositoryInventory.files("all");
    const configs = files.filter((file) =>
      /(?:^|\/)(?:\.prettierrc(?:\..+)?|prettier\.config(?:\..+)?)$/iu.test(file),
    );
    const errors = configs.length
      ? [`Standalone Prettier configuration files are not allowed: ${configs.join(", ")}.`]
      : [];
    if (files.includes(".prettierignore") && repositoryInventory.readText) {
      const ignoreText = await repositoryInventory.readText(".prettierignore");
      const patterns = ignoreText
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));
      const excluded = files.filter((file) => {
        if (!maintainedExtensions.has(file.slice(file.lastIndexOf(".")))) return false;
        return patterns.reduce((ignored, pattern) => {
          if (pattern.startsWith("!")) return ignored && !minimatch(file, pattern.slice(1));
          return ignored || minimatch(file, pattern);
        }, false);
      });
      if (excluded.length)
        errors.push(`.prettierignore must not exclude maintained files: ${excluded.join(", ")}.`);
    }
    return errors;
  } catch (error) {
    return [`Prettier configuration files could not be inspected: ${error.message}`];
  }
}
