function compatibleWithNode26(range) {
  return (
    /^(?:>=\s*)?26(?:\.x|\.\d+(?:\.\d+)?)?(?:\s*<\s*27(?:\.\d+(?:\.\d+)?)?)?$/.test(range) ||
    /^(?:\^|~)\s*26(?:\.\d+(?:\.\d+)?)?$/.test(range)
  );
}

export function validatePackageRuntime(packageJson) {
  if (typeof packageJson.engines?.node !== "string" || !compatibleWithNode26(packageJson.engines.node.trim()))
    return "package.json.engines.node must be compatible with Node.js 26.";
  if (!packageJson.jest || typeof packageJson.jest !== "object" || Array.isArray(packageJson.jest))
    return "package.json must contain Jest configuration.";
  return null;
}
