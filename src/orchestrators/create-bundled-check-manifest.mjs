/**
 * Build the machine-readable implementation registry from the discovered
 * modules. The filesystem path is part of the record so an ID cannot be
 * considered implemented merely because it appears in an ID set.
 */
export function createBundledCheckManifest(checks) {
  if (checks.some(({ enforcementMode }) => enforcementMode !== undefined
    && enforcementMode !== "deterministic" && enforcementMode !== "non-deterministic")) {
    throw new Error("Every bundled check must declare a valid enforcement mode.");
  }
  const records = checks.map(({ ruleId, parentRuleId = null, enforcementMode = "deterministic", modulePath }) => ({
    ruleId,
    parentRuleId,
    enforcementMode,
    modulePath,
  }));
  if (records.some(({ modulePath }) => typeof modulePath !== "string" || modulePath.length === 0)) {
    throw new Error("Every bundled check must have a module path.");
  }
  const ids = new Set();
  const paths = new Set();
  for (const record of records) {
    if (ids.has(record.ruleId)) throw new Error(`Duplicate bundled check manifest ID: ${record.ruleId}.`);
    if (paths.has(record.modulePath)) throw new Error(`Duplicate bundled check manifest path: ${record.modulePath}.`);
    ids.add(record.ruleId);
    paths.add(record.modulePath);
  }
  return Object.freeze({ version: "8.0", checks: records });
}
