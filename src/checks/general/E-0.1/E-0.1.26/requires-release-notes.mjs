const requiredProfiles = new Set(["application", "library", "npm-published", "ghcr-published"]);

export function requiresReleaseNotes(packageJson) {
  const profiles = packageJson?.eliware?.apply;
  return Array.isArray(profiles) && profiles.some((profile) => requiredProfiles.has(profile));
}
