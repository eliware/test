import { resolve } from "node:path";

export async function runCliInformationCommands({
  root,
  entrypoints,
  packageVersion,
  executeEntrypoint,
}) {
  const errors = [];
  for (const entrypoint of entrypoints) {
    for (const argument of ["--help", "--version"]) {
      const result = await executeCommand(executeEntrypoint, root, entrypoint, argument, errors);
      if (!result) continue;
      const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
      if (result.code !== 0 || result.signal != null) {
        errors.push(`CLI entrypoint ${entrypoint} must exit 0 for ${argument}.`);
      } else if (!output) {
        errors.push(`CLI entrypoint ${entrypoint} must produce output for ${argument}.`);
      } else if (argument === "--version" && !reportsPackageVersion(output, packageVersion)) {
        errors.push(
          `CLI entrypoint ${entrypoint} --version must report package version ${packageVersion}.`,
        );
      }
    }
  }
  return errors;
}

function reportsPackageVersion(output, packageVersion) {
  if (typeof packageVersion !== "string" || !packageVersion.trim()) return false;
  const versions = [
    ...output.matchAll(/(?<![\w.])v?(\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?)(?![\w.+-])/gu),
  ].map((match) => match[1]);
  return versions.length > 0 && versions.every((version) => version === packageVersion);
}

async function executeCommand(executeEntrypoint, root, entrypoint, argument, errors) {
  try {
    return await executeEntrypoint(process.execPath, [resolve(root, entrypoint), argument], {
      cwd: root,
    });
  } catch (error) {
    errors.push(`CLI entrypoint ${entrypoint} could not execute ${argument}: ${error.message}`);
    return null;
  }
}
