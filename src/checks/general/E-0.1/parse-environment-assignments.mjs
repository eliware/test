const assignment = /^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/;

export function parseEnvironmentAssignments(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*export\s+/, ""))
    .map((line) => assignment.exec(line))
    .filter(Boolean)
    .map(([, name, value]) => [name, value.replace(/^("|')(.*)\1$/, "$2").trim()]);
}
