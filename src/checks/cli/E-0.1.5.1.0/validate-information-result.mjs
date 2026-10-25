import { reportsPackageVersion } from "./reports-package-version.mjs";

export function validateCliInformationResult({ entrypoint, argument, result, packageVersion }) {
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.code !== 0 || result.signal != null)
    return [`CLI entrypoint ${entrypoint} must exit 0 for ${argument}.`];
  if (!output) return [`CLI entrypoint ${entrypoint} must produce output for ${argument}.`];
  if (argument === "--version" && !reportsPackageVersion(output, packageVersion))
    return [
      `CLI entrypoint ${entrypoint} --version must report package version ${packageVersion}.`,
    ];
  return [];
}
