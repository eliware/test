import { validateInternalExportBarrels } from "../../../../shared/validate-internal-export-barrels.mjs";
import { validateImplementationPlacement } from "../implementation-placement.mjs";
import { validateApplicationTests } from "./tests.mjs";

export async function validateApplicationLayout(context = {}) {
  const files = await context.repositoryInventory.files("all");
  const read = context.repositoryInventory.readText;
  const root = context.root ?? process.cwd();
  return [
    ...(await validateApplicationTests(files, read, root)),
    ...validateImplementationPlacement(
      files,
      context.packageJson?.eliware?.apply ?? [],
      context.packageJson,
    ),
    ...(await validateInternalExportBarrels(files, read, context.packageJson ?? {}, root)),
  ];
}
