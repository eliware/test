export function extractPackageScriptCommands(content) {
  let manifest;
  try {
    manifest = JSON.parse(content);
  } catch {
    return [];
  }
  return Object.values(manifest.scripts ?? {}).filter((command) => typeof command === "string");
}
