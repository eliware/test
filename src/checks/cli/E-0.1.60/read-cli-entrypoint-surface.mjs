import { access } from "node:fs/promises";
import { join } from "node:path";
import { readRepositoryText } from "../../read-repository-text.mjs";

export async function readCliEntrypointSurface(context) {
  const { root, packageJson } = context;
  const entrypoints =
    typeof packageJson?.bin === "string"
      ? [packageJson.bin]
      : Object.values(packageJson?.bin ?? {});
  if (entrypoints.length === 0) return { error: "CLI repositories must declare a bin entrypoint." };
  let readme;
  try {
    readme = await readRepositoryText(context, join(root, "README.md"));
    for (const entrypoint of entrypoints) await access(join(root, entrypoint));
  } catch {
    return { error: "Every declared CLI bin entrypoint and README.md must exist." };
  }
  for (const term of ["--help", "--version", "exit code"]) {
    if (!readme.toLowerCase().includes(term.toLowerCase()))
      return { error: `CLI README.md must document ${term}.` };
  }
  const entrypointText = await Promise.all(
    entrypoints.map((entrypoint) => readRepositoryText(context, join(root, entrypoint))),
  ).then((texts) => texts.join("\n"));
  if (
    /\b(?:publish|deploy|delete|remove|destroy|push)\b/i.test(entrypointText) &&
    !/(?:dry[- ]run|confirm|confirmation)/i.test(`${readme}\n${entrypointText}`)
  ) {
    return { error: "Destructive CLI actions must provide dry-run or confirmation controls." };
  }
  return { entrypoints, readme };
}
