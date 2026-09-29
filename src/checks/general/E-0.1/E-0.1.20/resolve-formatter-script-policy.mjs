export function resolveFormatterScriptPolicy(packageJson = {}) {
  const profiles = new Set(
    Array.isArray(packageJson.eliware?.apply) ? packageJson.eliware.apply : [],
  );
  return {
    requiresPack: profiles.has("npm-published"),
    selfHosted: packageJson.name === "@eliware/test",
    allowedAdditionalScripts: [
      ...(profiles.has("library") ? ["typecheck"] : []),
      ...(profiles.has("web") ? ["build"] : []),
      ...(profiles.has("web") ? ["lighthouse", "puppeteer"] : []),
    ],
  };
}
