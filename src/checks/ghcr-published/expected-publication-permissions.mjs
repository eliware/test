const permissionSets = {
  "npm-published": { contents: "read", "id-token": "write" },
  "ghcr-published": {
    contents: "read",
    packages: "write",
    "id-token": "write",
    attestations: "write",
    "artifact-metadata": "write",
  },
};

export function expectedPublicationPermissions(profiles = []) {
  const permissions = {};
  for (const profile of profiles) Object.assign(permissions, permissionSets[profile] ?? {});
  return permissions;
}

export function hasExactPublicationPermissions(actual, profiles = []) {
  const expected = expectedPublicationPermissions(profiles);
  return Boolean(
    actual &&
    typeof actual === "object" &&
    !Array.isArray(actual) &&
    Object.keys(actual).length === Object.keys(expected).length &&
    Object.entries(expected).every(([key, value]) => actual[key] === value),
  );
}

export function hasReadOnlyWorkflowPermissions(actual) {
  return Boolean(
    actual &&
    typeof actual === "object" &&
    !Array.isArray(actual) &&
    Object.keys(actual).length === 1 &&
    actual.contents === "read",
  );
}
