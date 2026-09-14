import { readPackageJson } from "../cli/read-package-json.mjs";

export async function loadValidationTarget(root) {
  return readPackageJson(root);
}
