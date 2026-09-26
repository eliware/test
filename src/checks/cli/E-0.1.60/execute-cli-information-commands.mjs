import { resolve } from "node:path";

export async function executeCliInformationCommands({
  root,
  entrypoints,
  packageVersion,
  executeEntrypoint,
}) {
  for (const entrypoint of entrypoints) {
    for (const argument of ["--help", "--version"]) {
      let result;
      try {
        result = await executeEntrypoint(process.execPath, [resolve(root, entrypoint), argument], {
          cwd: root,
        });
      } catch (error) {
        return `CLI entrypoint ${entrypoint} could not execute ${argument}: ${error.message}`;
      }
      if (result.code !== 0) {
        return `CLI entrypoint ${entrypoint} must exit 0 for ${argument}; received ${result.code}.`;
      }
      const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
      if (!output) return `CLI entrypoint ${entrypoint} must produce output for ${argument}.`;
      if (
        argument === "--version" &&
        typeof packageVersion === "string" &&
        !output.split(/\s+/u).includes(packageVersion)
      ) {
        return `CLI entrypoint ${entrypoint} --version must report package version ${packageVersion}.`;
      }
    }
  }
  return "";
}
