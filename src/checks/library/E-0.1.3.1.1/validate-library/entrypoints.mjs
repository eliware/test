import { validateLibraryInternalExportBarrels } from "./internal-export-barrels.mjs";
import { collectLibraryExportTargets } from "../collect-library-export-targets.mjs";
import { validateLibraryRuntimeEntrypoints } from "./runtime-entrypoints.mjs";
import { validateLibraryDeclarationEntrypoints } from "./declaration-entrypoints.mjs";
import { stat } from "node:fs/promises";
import { validateSingleDefaultMethods } from "../../../shared/single-default-methods.mjs";

export async function validateLibraryEntrypoints(context = {}, dependencies = {}) {
  const packageJson = context.packageJson ?? {};
  const root = context.root ?? process.cwd();
  const checkFile = dependencies.stat ?? stat;
  const errors = [];
  const exportTargets = collectLibraryExportTargets(packageJson.exports);
  errors.push(
    ...(await validateLibraryRuntimeEntrypoints(root, packageJson, exportTargets, checkFile)),
  );
  let files = [];
  if (context.repositoryInventory) {
    files = await context.repositoryInventory.files("all");
  }
  errors.push(
    ...(await validateLibraryDeclarationEntrypoints(
      root,
      packageJson,
      exportTargets,
      files,
      checkFile,
    )),
  );
  if (context.repositoryInventory) {
    errors.push(
      ...(await validateLibraryInternalExportBarrels(
        files,
        context.repositoryInventory.readText,
        packageJson,
        root,
      )),
    );
    errors.push(
      ...(await validateSingleDefaultMethods(
        files,
        context.repositoryInventory.readText,
        packageJson,
        root,
        { library: true },
      )),
    );
  }
  return errors;
}
