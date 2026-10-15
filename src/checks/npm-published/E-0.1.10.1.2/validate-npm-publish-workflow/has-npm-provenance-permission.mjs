export function hasNpmProvenancePermission(workflow) {
  const publishJob = workflow?.jobs?.publish;
  const permissionScope = publishJob?.permissions;
  return (
    permissionScope !== null &&
    typeof permissionScope === "object" &&
    !Array.isArray(permissionScope) &&
    permissionScope.contents === "read" &&
    permissionScope["id-token"] === "write" &&
    Object.keys(permissionScope).length === 2
  );
}

export function hasNpmWorkflowReadPermissions(workflow) {
  return hasOnlyContentsRead(workflow?.permissions);
}

export function hasNpmValidationReadPermissions(workflow) {
  const permissions = workflow?.jobs?.validate?.permissions;
  return permissions === undefined || hasOnlyContentsRead(permissions);
}

function hasOnlyContentsRead(permissions) {
  return (
    permissions !== null &&
    typeof permissions === "object" &&
    !Array.isArray(permissions) &&
    permissions.contents === "read" &&
    Object.keys(permissions).length === 1
  );
}
