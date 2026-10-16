export function createBundledCheckManifest(checks) {
  if (
    checks.some(
      ({ enforcementMode, applicability }) =>
        enforcementMode === "non-deterministic" && applicability !== "advisory-only",
    )
  ) {
    throw new Error("Non-deterministic checks must be advisory-only.");
  }
  if (
    checks.some(
      ({ enforcementMode }) =>
        enforcementMode !== undefined &&
        enforcementMode !== "deterministic" &&
        enforcementMode !== "non-deterministic",
    )
  ) {
    throw new Error("Each bundled check must declare a valid enforcement mode.");
  }
  const records = checks.map(
    ({
      ruleId,
      parentRuleId = null,
      enforcementMode = "deterministic",
      modulePath,
      ownerProfile,
      requiredProfiles,
    }) => ({
      ruleId,
      parentRuleId,
      enforcementMode,
      modulePath,
      ...(ownerProfile === undefined ? {} : { ownerProfile }),
      ...(requiredProfiles === undefined ? {} : { requiredProfiles }),
    }),
  );
  if (records.some(({ modulePath }) => typeof modulePath !== "string" || modulePath.length === 0)) {
    throw new Error("Each bundled check must have a module path.");
  }
  const ids = new Set();
  const paths = new Set();
  for (const record of records) {
    if (ids.has(record.ruleId))
      throw new Error(`Duplicate bundled check manifest ID: ${record.ruleId}.`);
    if (paths.has(record.modulePath))
      throw new Error(`Duplicate bundled check manifest path: ${record.modulePath}.`);
    ids.add(record.ruleId);
    paths.add(record.modulePath);
  }
  const version = packageMetadata.version.split(".").slice(0, 2).join(".");
  return Object.freeze({ version, checks: records });
}
import packageMetadata from "../../../package.json" with { type: "json" };
