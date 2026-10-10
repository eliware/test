import { readCanonicalOrder } from "../../../validation/shared/conventions/read-canonical-order.mjs";
import { derivePackageFilesAllowlist } from "../../../validation/stages/pack/derive-package-files-allowlist.mjs";
import { validateOrderedPackageFiles } from "../../../validation/stages/pack/validate-ordered-package-files.mjs";

function isSafePath(path) {
  if (typeof path !== "string" || !path || path !== path.trim() || path.includes("\\"))
    return false;
  if (path.startsWith("/") || /^[A-Za-z]:/u.test(path)) return false;
  const parts = (path.endsWith("/") ? path.slice(0, -1) : path).split("/");
  return parts.every((part) => part && part !== "." && part !== "..");
}

export function validateNpmPackageFiles(packageJson = {}) {
  const files = packageJson.files;
  if (!Array.isArray(files) || files.length === 0)
    return ["package.json.files must be a nonempty array for npm publication."];
  const unsafeIndex = files.findIndex((entry) => !isSafePath(entry));
  if (unsafeIndex !== -1)
    return [`package.json.files contains an unsafe path entry: ${files[unsafeIndex]}.`];
  const duplicate = new Set(files).size !== files.length;
  if (duplicate) return ["package.json.files must not contain duplicate paths."];
  const ordering = readCanonicalOrder("package-files.yaml");
  if (!files.includes(ordering.profileEntries["npm-published"]))
    return ["package.json.files must include specs/ for npm publication."];
  const required = derivePackageFilesAllowlist(packageJson);
  const orderError = validateOrderedPackageFiles(files, required);
  if (orderError) return [orderError];
  return [];
}
