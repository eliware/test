export function readSensitiveExemptions(packageJson, ruleId) {
  return new Set(
    (packageJson?.eliware?.exempt ?? [])
      .filter((entry) => entry.ruleId === ruleId && typeof entry.path === "string")
      .map((entry) => entry.path.replaceAll("\\", "/")),
  );
}
