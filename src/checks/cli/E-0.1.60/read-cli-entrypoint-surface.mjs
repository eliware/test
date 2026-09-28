import { access } from "node:fs/promises";
import { join } from "node:path";
import { readRepositoryText } from "../../read-repository-text.mjs";

export async function readCliEntrypointSurface(context) {
  const { root, packageJson } = context;
  const entrypoints =
    typeof packageJson?.bin === "string"
      ? [packageJson.bin]
      : Object.values(packageJson?.bin ?? {});
  const errors = [];
  if (entrypoints.length === 0) {
    return { errors: ["CLI repositories must declare a bin entrypoint."], entrypoints: [] };
  }
  let readme;
  try {
    readme = await readRepositoryText(context, join(root, "README.md"));
  } catch {
    errors.push("README.md must exist for CLI documentation validation.");
  }
  const availableEntrypoints = [];
  const entrypointTexts = [];
  for (const entrypoint of entrypoints) {
    try {
      await access(join(root, entrypoint));
      entrypointTexts.push(await readRepositoryText(context, join(root, entrypoint)));
      availableEntrypoints.push(entrypoint);
    } catch {
      errors.push(`CLI bin entrypoint must exist and be readable: ${entrypoint}.`);
    }
  }
  if (readme !== undefined) {
    const missingTerms = ["--help", "--version", "exit code"].filter(
      (term) => !readme.toLowerCase().includes(term.toLowerCase()),
    );
    errors.push(...missingTerms.map((term) => `CLI README.md must document ${term}.`));
  }
  const entrypointText = entrypointTexts.join("\n");
  if (entrypointText && /\b(?:publish|deploy|delete|remove|destroy|push)\b/i.test(entrypointText)) {
    if (!/(?:dry[- ]run|confirm|confirmation)/i.test(`${readme ?? ""}\n${entrypointText}`)) {
      errors.push("Destructive CLI actions must provide dry-run or confirmation controls.");
    }
  }
  return { errors, entrypoints: availableEntrypoints, readme };
}
