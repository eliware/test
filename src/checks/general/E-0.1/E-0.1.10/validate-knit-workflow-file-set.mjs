const expected = [".knit/deploy.yaml"];

export function validateKnitWorkflowFileSet(workflowPaths) {
  const actual = [...workflowPaths].sort();
  if (actual.length === expected.length && actual[0] === expected[0]) return null;
  const describe = (paths) => (paths.length ? paths.join(", ") : "none");
  return `Knit workflow files must be exactly ${describe(expected)}; found ${describe(actual)}.`;
}
