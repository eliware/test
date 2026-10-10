export function hasGhcrPublisherPermissions(value) {
  const required = {
    contents: "read",
    packages: "write",
    "id-token": "write",
    attestations: "write",
    "artifact-metadata": "write",
  };
  return (
    value &&
    Object.keys(value).length === Object.keys(required).length &&
    Object.entries(required).every(([key, permission]) => value[key] === permission)
  );
}

export function hasGhcrWorkflowReadPermissions(value) {
  return value && Object.keys(value).length === 1 && value.contents === "read";
}
