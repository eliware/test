function hasGhcrWorkflowReadPermissions(value) {
  return value && Object.keys(value).length === 1 && value.contents === "read";
}
function hasGhcrValidationReadPermissions(value) {
  return value === undefined || hasGhcrWorkflowReadPermissions(value);
}
export default hasGhcrValidationReadPermissions;
