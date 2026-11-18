function hasGhcrWorkflowReadPermissions(value) {
  return value && Object.keys(value).length === 1 && value.contents === "read";
}
export default hasGhcrWorkflowReadPermissions;
