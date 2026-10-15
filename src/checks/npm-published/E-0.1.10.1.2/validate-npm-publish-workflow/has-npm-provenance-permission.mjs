export function hasNpmProvenancePermission(workflow) {
  const publishJob = workflow?.jobs?.publish;
  const permissionScope = Object.hasOwn(publishJob ?? {}, "permissions")
    ? publishJob.permissions
    : workflow?.permissions;
  return (
    permissionScope !== null &&
    typeof permissionScope === "object" &&
    !Array.isArray(permissionScope) &&
    permissionScope["id-token"] === "write"
  );
}
