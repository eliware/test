export function hasGhcrPublisherPermissions(value) {
  const required = {
    contents: "read",
    packages: "write",
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

export function hasGhcrValidationReadPermissions(value) {
  return value === undefined || hasGhcrWorkflowReadPermissions(value);
}
