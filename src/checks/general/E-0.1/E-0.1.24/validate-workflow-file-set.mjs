const publicationProfiles = new Set(["npm-published", "ghcr-published"]);

export function validateWorkflowFileSet(workflowNames, packageJson = {}) {
  const expected = ["ci.yml"];
  const applied = packageJson?.eliware?.apply;
  if (Array.isArray(applied) && applied.some((profile) => publicationProfiles.has(profile))) {
    expected.push("publish.yml");
  }

  const actual = [...workflowNames].sort();
  const required = [...expected].sort();
  if (actual.length === required.length && actual.every((name, index) => name === required[index])) {
    return null;
  }

  const describe = (names) =>
    names.length > 0 ? names.map((name) => `.github/workflows/${name}`).join(", ") : "none";
  return `GitHub Actions workflow files must be exactly ${describe(required)}; found ${describe(actual)}.`;
}
