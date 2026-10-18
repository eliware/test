import { readNestedGitignorePaths } from "./read-nested-gitignore-paths.mjs";

export async function validateNestedGitIgnoreFiles(root, runGit, isPathExempt = () => false) {
  const result = await readNestedGitignorePaths(root, runGit);
  if (result.error) return [result.error];
  const nested = result.paths.filter(
    (path) => path.endsWith("/.gitignore") && path !== ".gitignore" && !isPathExempt(path),
  );
  return nested.length ? [`Nested .gitignore files are prohibited: ${nested.join(", ")}.`] : [];
}
