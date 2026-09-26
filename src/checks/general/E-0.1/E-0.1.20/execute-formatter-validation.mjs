import { validatePrettierArguments } from "../../../validate-prettier-arguments.mjs";

export async function executeFormatterValidation({
  root,
  executeFormat,
  mode,
  runFormatter,
  toolArgs = [],
  focusedScope = null,
}) {
  if (!executeFormat || (mode !== null && mode !== "format" && mode !== "format-check"))
    return null;
  const argumentError = validatePrettierArguments(toolArgs);
  if (argumentError) return argumentError;
  try {
    const formatterOptions = { write: mode === "format", extraArgs: toolArgs };
    if (focusedScope) formatterOptions.paths = focusedScope.paths;
    const result = await runFormatter(root, formatterOptions);
    if (result.code !== 0) {
      const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      return detail ? `Prettier failed: ${detail}` : "Prettier failed without diagnostics.";
    }
    return "";
  } catch (error) {
    return `Prettier could not be started: ${error.message}`;
  }
}
