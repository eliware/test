export function validateCiWorkflowAccess(document, job) {
  const errors = [];
  if (!onlyReadPermissions(document.permissions))
    errors.push("ci.yaml workflow permissions must contain only contents: read.");
  if (Object.hasOwn(document, "env"))
    errors.push("ci.yaml must not define inherited workflow environment values.");
  if (job && !onlyReadPermissions(job.permissions))
    errors.push("ci.yaml validation job permissions must contain only contents: read.");
  if (job && Object.hasOwn(job, "env"))
    errors.push("ci.yaml validation job must not define inherited environment values.");
  if (hasRunOverrides(document.defaults) || (job && hasRunOverrides(job.defaults)))
    errors.push("ci.yaml must not set inherited shell or working-directory overrides.");
  return errors;
}

function hasRunOverrides(defaults) {
  return ["shell", "working-directory"].some((key) => Object.hasOwn(defaults?.run ?? {}, key));
}

function onlyReadPermissions(permissions) {
  return Boolean(
    permissions && Object.keys(permissions).length === 1 && permissions.contents === "read",
  );
}
