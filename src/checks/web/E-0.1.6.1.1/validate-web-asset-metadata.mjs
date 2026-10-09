export function validateWebAssetMetadata(packageJson = {}) {
  const eliware = packageJson?.eliware ?? {};
  return ["webRoot", "webAssetExcludes"]
    .filter((key) => Object.hasOwn(eliware, key))
    .map((key) => `Do not set package.json.eliware.${key}; the web asset root is public/.`);
}
