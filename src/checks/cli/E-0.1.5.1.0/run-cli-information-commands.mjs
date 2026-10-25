import { resolve } from "node:path";
import { validateCliInformationResult } from "./validate-information-result.mjs";

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
      errors.push(
        ...validateCliInformationResult({ entrypoint, argument, result, packageVersion }),
      );
    }
  }
  return errors;
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
