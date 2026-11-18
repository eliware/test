import readPackageJson from "../../cli/read/package-json.mjs";
export default async function loadValidationTarget(root) {
  return readPackageJson(root);
}
