const placeholder =
  /^(?:<[^<>]+>|\$\{[A-Z_][A-Z0-9_]*\}|(?:your|change_me|replace_me|placeholder|example)[-_A-Z0-9]*)$/iu;

export function validateEnvExampleContent(content) {
  const assignments = String(content)
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  if (!assignments.length) return ".env.example must contain placeholder assignments.";
  const invalid = assignments.filter((line) => {
    const match = line.match(/^[A-Za-z_][A-Za-z0-9_]*\s*=\s*(.+)$/u);
    if (!match) return true;
    const value = match[1].replace(/^(["'])(.*)\1$/u, "$2").trim();
    return !placeholder.test(value);
  });
  return invalid.length
    ? `.env.example must use placeholder values: ${invalid.map((line) => line.split("=", 1)[0]).join(", ")}.`
    : null;
}
