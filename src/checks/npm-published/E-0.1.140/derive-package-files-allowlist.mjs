const baseEntries = ["src/", "docs/", "README.md", "AGENTS.md", "LICENSE", "RELEASE_NOTES.md"];

export function derivePackageFilesAllowlist(packageJson) {
  const profiles = packageJson?.eliware?.apply ?? [];
  const entries = [...baseEntries];
  if (profiles.includes("cli")) entries.push("bin/");
  if (profiles.includes("library")) entries.push("examples/");
  if (packageJson?.name === "@eliware/test") entries.push("specs/");
  if (packageJson?.files?.includes(".env.example")) entries.push(".env.example");
  return entries;
}
