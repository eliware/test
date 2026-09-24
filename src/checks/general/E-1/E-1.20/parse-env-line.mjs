const assignment = /^\s*(#\s*)?([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/;

export function parseEnvironmentLine(line) {
  const match = assignment.exec(line);
  if (match) {
    const [, comment, name, rawValue] = match;
    const value = rawValue.replace(/^("|')(.*)\1$/u, "$2").trim();
    return { type: "assignment", name, value, optional: Boolean(comment) };
  }
  const trimmed = line.trim();
  if (trimmed.startsWith("#")) return { type: "comment", value: trimmed.slice(1).trim() };
  return { type: trimmed ? "content" : "blank" };
}
