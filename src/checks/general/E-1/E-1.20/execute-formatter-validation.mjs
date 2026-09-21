export async function executeFormatterValidation({
  root,
  executeFormat,
  mode,
  runFormatter,
  toolArgs = [],
}) {
  if (!executeFormat || (mode !== null && mode !== "format" && mode !== "format-check"))
    return null;
  try {
    const result = await runFormatter(root, { write: mode === "format", extraArgs: toolArgs });
    if (result.code !== 0) {
      const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      return detail ? `Prettier failed: ${detail}` : "Prettier failed without diagnostics.";
    }
    return "";
  } catch (error) {
    return `Prettier could not be started: ${error.message}`;
  }
}
