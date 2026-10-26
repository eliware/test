import { validateCliVersionResult } from "./version-result.mjs";

export function validateCliInformationResult({ entrypoint, argument, result, packageVersion }) {
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.code !== 0 || result.signal != null)
    return [`CLI entrypoint ${entrypoint} must exit 0 for ${argument}.`];
  if (!output) return [`CLI entrypoint ${entrypoint} must produce output for ${argument}.`];
  if (argument === "--version") return validateCliVersionResult(entrypoint, output, packageVersion);
  return [];
}
