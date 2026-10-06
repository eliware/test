import { minimatch } from "minimatch";

const maintainedExtensions = new Set([".mjs", ".json", ".yml", ".yaml", ".md"]);

export async function validateStandalonePrettierConfiguration(repositoryInventory) {
  if (!repositoryInventory?.files) return [];
  try {
    const files = await repositoryInventory.files("all");
    const configs = files.filter((file) =>
      /(?:^|\/)(?:\.editorconfig|\.prettierrc(?:\..+)?|prettier\.config(?:\..+)?)$/iu.test(file),
    );
    const errors = configs.length
      ? [`Standalone Prettier configuration files are not allowed: ${configs.join(", ")}.`]
      : [];
    if (repositoryInventory.readText) {
      for (const ignoreFile of [".gitignore", ".prettierignore"]) {
        if (!files.includes(ignoreFile)) continue;
        const ignoreText = await repositoryInventory.readText(ignoreFile);
        const patterns = ignoreText
          .split(/\r?\n/u)
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith("#"));
        const excluded = files.filter(
          (file) =>
            maintainedExtensions.has(file.slice(file.lastIndexOf("."))) &&
            isIgnored(file, patterns),
        );
        if (excluded.length)
          errors.push(`${ignoreFile} must not exclude maintained files: ${excluded.join(", ")}.`);
      }
    }
    return errors;
  } catch (error) {
    return [`Prettier configuration files could not be inspected: ${error.message}`];
  }
}

function isIgnored(file, patterns) {
  const parts = file.split("/");
  const paths = parts.map((_, index) => parts.slice(0, index + 1).join("/"));
  const ignored = paths.map((path, index) =>
    patterns.reduce((state, value) => {
      const negated = value.startsWith("!");
      const rawPattern = negated ? value.slice(1) : value;
      const directoryOnly = rawPattern.endsWith("/");
      const anchored = rawPattern.startsWith("/") || rawPattern.includes("/");
      const pattern = rawPattern.replace(/^\//u, "").replace(/\/$/u, "");
      const isDirectory = index < paths.length - 1;
      const matches =
        (!directoryOnly || isDirectory) &&
        minimatch(path, pattern, { matchBase: !anchored, dot: true });
      return matches ? !negated : state;
    }, false),
  );
  return ignored.some((value, index) => index < ignored.length - 1 && value) || ignored.at(-1);
}
