import { verifySmokeTargetInstallation } from "./load-smoke-target/installed-state.mjs";
import { readSmokeTargetPackage } from "./load-smoke-target/package.mjs";
import { validateSmokeTargetRequirements } from "./load-smoke-target/requirements.mjs";

export { hasPackageDependency } from "./load-smoke-target/requirements.mjs";

export async function loadSmokeTarget(targetRoot, packageName) {
  let targetPackage;
  try {
    targetPackage = await readSmokeTargetPackage(targetRoot);
    if (targetPackage?.name === packageName)
      return { error: validateSmokeTargetRequirements(targetPackage, packageName) };
    await verifySmokeTargetInstallation(targetRoot, packageName);
  } catch {
    return {
      error: "Smoke target must be an existing npm repository with installed dependencies.",
    };
  }
  const requirementsError = validateSmokeTargetRequirements(targetPackage, packageName);
  if (requirementsError) return { error: requirementsError };
  return { targetPackage, error: null };
}
