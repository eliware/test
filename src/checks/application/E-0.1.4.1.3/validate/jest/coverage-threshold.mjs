const metrics = ["branches", "functions", "lines", "statements"];

export function validateJestCoverageThreshold(coverageThreshold) {
  const errors = [];
  const threshold = coverageThreshold?.global;
  if (JSON.stringify(Object.keys(coverageThreshold ?? {}).sort()) !== '["global"]')
    errors.push("Jest coverageThreshold must define only global coverage.");
  if (JSON.stringify(Object.keys(threshold ?? {}).sort()) !== JSON.stringify(metrics))
    errors.push("Jest global coverage must define only the four required metrics.");
  for (const metric of metrics)
    if (threshold?.[metric] !== 100)
      errors.push(`Jest global ${metric} coverage must be 100 percent.`);
  return errors;
}
