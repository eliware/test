export function checkPublishMetadata(packageJson, finding) {
  if (packageJson.private === true) return [];
  if (packageJson.publishConfig?.provenance !== true) {
    return [finding('package.json: publishable packages must set publishConfig.provenance to true')];
  }
  return [];
}

