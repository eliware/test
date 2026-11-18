import findPackageScriptValidatorPaths from "../../../../shared/package-scripts/validate/package-script-file-locations/find-package-script-validator-paths.mjs";
export default function resolveAllowedImplementationRoots(profiles, packageJson) {
  const discoveryRoots = [];
  if (profiles.includes("discord")) discoveryRoots.push("commands", "events");
  if (profiles.includes("mcp-server")) discoveryRoots.push("tools");
  return {
    validatorPaths: new Set(findPackageScriptValidatorPaths(packageJson)),
    allowedRootFiles: profiles.includes("web") ? new Set(["webpack.config.mjs"]) : new Set(),
    allowedDiscoveryPath: new RegExp(`^(?:${discoveryRoots.join("|")})/`, "u"),
  };
}
