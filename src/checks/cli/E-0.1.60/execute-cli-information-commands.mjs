import { resolve } from "node:path";

export async function executeCliInformationCommands({
  root,
  entrypoints,
  packageVersion,
  executeEntrypoint,
}) {
  const failures = [];
  for (const entrypoint of entrypoints) {
    for (const argument of ["--help", "--version"]) {
      let result;
      try {
        result = await executeEntrypoint(process.execPath, [resolve(root, entrypoint), argument], {
          cwd: root,
        });
      } catch (error) {
        failures.push(
          `CLI entrypoint ${entrypoint} could not execute ${argument}: ${error.message}`,
        );
        continue;
      }
      if (result.code !== 0) {
        failures.push(
          `CLI entrypoint ${entrypoint} must exit 0 for ${argument}; received ${result.code}.`,
        );
        continue;
      }
      const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
      if (!output) {
        failures.push(`CLI entrypoint ${entrypoint} must produce output for ${argument}.`);
        continue;
      }
      if (
        argument === "--version" &&
        typeof packageVersion === "string" &&
        !output.split(/\s+/u).includes(packageVersion)
      ) {
        failures.push(
          `CLI entrypoint ${entrypoint} --version must report package version ${packageVersion}.`,
        );
      }
    }
  }
  return failures.join("\n");
}
