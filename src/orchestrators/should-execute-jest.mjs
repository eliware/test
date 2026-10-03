export function shouldExecuteJest(executeJestOption, appliedProfiles) {
  return (
    executeJestOption !== false &&
    appliedProfiles.some((profile) => profile === "application" || profile === "library")
  );
}
