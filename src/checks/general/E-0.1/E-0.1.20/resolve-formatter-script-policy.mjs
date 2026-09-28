export function resolveFormatterScriptPolicy(packageJson = {}) {
  const profiles = new Set(
    Array.isArray(packageJson.eliware?.apply) ? packageJson.eliware.apply : [],
  );
  const capabilities = new Set(
    Array.isArray(packageJson.eliware?.capabilities) ? packageJson.eliware.capabilities : [],
  );
  return {
    requiresPack: profiles.has("npm-published"),
    selfHosted: packageJson.name === "@eliware/test",
    allowedAdditionalScripts: [
      ...(capabilities.has("typecheck") ? ["typecheck"] : []),
      ...(capabilities.has("build") ? ["build"] : []),
      ...(profiles.has("web") ? ["lighthouse", "puppeteer"] : []),
    ],
  };
}
