import prettier from "prettier";
import { minimatch } from "minimatch";
import { join } from "node:path";
import { readTrackedFilePaths } from "./read-tracked-file-paths.mjs";

const maintainedExtensions = new Set([".mjs", ".json", ".yml", ".yaml", ".md"]);

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
    const prettierIgnoreFiles = files.filter((file) => /(?:^|\/)\.prettierignore$/iu.test(file));
    if (prettierIgnoreFiles.length)
      errors.push(`Prettier ignore files are not allowed: ${prettierIgnoreFiles.join(", ")}.`);
    if (repositoryInventory.readText) {
      for (const ignoreFile of [".gitignore"]) {
        if (!files.includes(ignoreFile)) continue;
        const ignoreText = await repositoryInventory.readText(ignoreFile);
        const patterns = ignoreText
          .split(/\r?\n/u)
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith("#"));
        const excluded = root
          ? await findPrettierIgnored(
              files,
              root,
              ignoreFile,
              await readTrackedFilePaths(root, runGit),
            )
          : files.filter(
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

async function findPrettierIgnored(files, root, ignoreFile, trackedFiles) {
  const ignorePath = [join(root, ignoreFile)];
  const ignored = [];
  for (const file of files) {
    if (!maintainedExtensions.has(file.slice(file.lastIndexOf(".")))) continue;
    if (
      trackedFiles.has(file) &&
      (await prettier.getFileInfo(join(root, file), { ignorePath })).ignored
    )
      ignored.push(file);
  }
  return ignored;
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
