export function validatePackagePublicationMetadata(packageJson) {
  const apply = packageJson?.eliware?.apply ?? [];
  if (apply.includes("private") && packageJson.private !== true) return "Private convention repositories must set package.json.private to true.";
  if (apply.includes("npm-published") && packageJson.private === true) return "npm-published convention repositories must not set package.json.private to true.";
  if (apply.includes("npm-published") && packageJson.publishConfig?.provenance !== true) return "npm-published convention repositories must enable publishConfig.provenance.";
  return null;
}
