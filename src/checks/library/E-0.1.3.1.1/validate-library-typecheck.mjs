import { validateDirectToolScript } from "../../../validation/stages/scripts/validate-direct-tool-script.mjs";

export function validateLibraryTypecheck(packageJson = {}) {
  const error = validateDirectToolScript(packageJson.scripts?.typecheck, "typecheck", packageJson);
  return error ? [`package.json ${error}`] : [];
}
