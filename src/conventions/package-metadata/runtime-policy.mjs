export function checkRuntimeMetadata(packageJson, finding) {
  if (packageJson.private === true) return [];
  if (typeof packageJson.engines?.node !== 'string' || packageJson.engines.node.trim() === '') {
    return [finding('package.json: publishable packages must declare a non-empty engines.node requirement')];
  }
  return [];
}

