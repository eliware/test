const publishedFiles = ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs", "specs"];

function isPublicPackage(packageJson) {
  return packageJson?.eliware?.apply?.includes("npm-published") || packageJson?.publishConfig?.access === "public";
}

export function validatePublicationFiles(packageJson) {
  if (!isPublicPackage(packageJson)) return null;
  if (!Array.isArray(packageJson.files) || packageJson.files.length === 0 || packageJson.files.some((file) => typeof file !== "string" || file.trim().length === 0))
    return "Public npm packages must define a nonempty files allowlist.";
  const allowlist = new Set(packageJson.files.map((file) => file.replace(/[\\/]$/, "")));
  const missing = publishedFiles.filter((file) => !allowlist.has(file));
  return missing.length > 0 ? `Public npm package files must allowlist: ${missing.join(", ")}.` : null;
}
