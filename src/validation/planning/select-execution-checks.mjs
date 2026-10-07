export function selectExecutionChecks(checks, focusedScope) {
  return focusedScope ? checks.filter(({ focusedSafe }) => focusedSafe === true) : checks;
}
