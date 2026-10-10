import { requiredIgnoreCases } from "./validate-ignore-patterns.mjs";

export async function validateGitIgnoreProbes(root, runGit) {
  const errors = [];
  for (const [path, shouldIgnore] of requiredIgnoreCases) {
    try {
      const result = await runGit("git", ["-C", root, "check-ignore", "--quiet", path], {
        windowsHide: true,
      });
      const code = result.code ?? 0;
      if (code !== 0 && shouldIgnore) errors.push(`${path} must be ignored.`);
      if (code === 0 && !shouldIgnore) errors.push(`${path} must not be ignored.`);
    } catch (error) {
      if (error.code === "ENOENT" || error.code !== 1)
        errors.push(`Git ignore rules could not be inspected for ${path}.`);
      else if (shouldIgnore) errors.push(`${path} must be ignored.`);
    }
  }
  return errors;
}
