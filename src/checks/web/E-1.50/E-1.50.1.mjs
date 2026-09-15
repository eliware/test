import { readdir } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.50.1";
export const parentRuleId = "E-1.50";

async function collectAssetPaths(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    paths.push(path);
    if (entry.isDirectory()) paths.push(...await collectAssetPaths(resolve(directory, entry.name), path));
  }
  return paths;
}

function matchesExclusion(path, exclusion) {
  const normalizedPath = path.replaceAll("\\", "/");
  const normalizedExclusion = exclusion.trim().replaceAll("\\", "/").replace(/^\.\//u, "").replace(/\/+$/u, "");
  const pattern = normalizedExclusion.replace(/[.+^${}()|[\]\\]/gu, "\\$&").replaceAll("*", ".*");
  return new RegExp(`(?:^|/)${pattern}(?:/|$)`, "u").test(normalizedPath);
}

export async function run({ root, packageJson }) {
  const assetRoot =
    typeof packageJson?.eliware?.webRoot === "string" && packageJson.eliware.webRoot.trim()
      ? packageJson.eliware.webRoot.trim()
      : "public";
  const configuredExclusions = packageJson?.eliware?.webAssetExcludes;
  if (
    configuredExclusions !== undefined &&
    (!Array.isArray(configuredExclusions) || configuredExclusions.some((value) => typeof value !== "string" || !value.trim()))
  ) {
    return fail(ruleId, "eliware.webAssetExcludes must be a string array when provided.");
  }
  const exclusions = [
    "dist",
    "build",
    "coverage",
    "node_modules",
    ".git",
    ...(configuredExclusions ?? []),
  ];
  const resolvedRoot = resolve(root);
  const resolvedAssets = resolve(resolvedRoot, assetRoot);
  if (isAbsolute(assetRoot) || (relative(resolvedRoot, resolvedAssets).startsWith(`..${sep}`) || relative(resolvedRoot, resolvedAssets) === ".."))
    return fail(ruleId, "eliware.webRoot must resolve inside the repository root.");
  try {
    const paths = await collectAssetPaths(resolvedAssets);
    const excluded = paths.find((path) => exclusions.some((exclusion) => matchesExclusion(path, exclusion)));
    if (excluded)
      return fail(ruleId, `Web public assets must not include excluded output: ${excluded}.`);
  } catch {
    return fail(ruleId, `${assetRoot}/ is required as the web public asset root.`);
  }
  return pass(ruleId);
}
