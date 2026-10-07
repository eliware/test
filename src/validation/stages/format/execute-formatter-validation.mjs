import { validatePrettierArguments } from "./validate-prettier-arguments.mjs";
import { createFormatterDiagnostic } from "./create-formatter-diagnostic.mjs";
import { resolveFocusedFormatterPaths } from "./resolve-focused-formatter-paths.mjs";

export async function executeFormatterValidation({
  root,
  executeFormat,
  mode,
  runFormatter,
  toolArgs = [],
  focusedScope = null,
  env = process.env,
}) {
  if (
    !(executeFormat || mode === "format" || mode === "format-check") ||
    (mode !== null && mode !== "format" && mode !== "format-check")
  )
    return null;
  // codescope ignore: formatter arguments are validated only after this guard confirms a formatter mode is selected.
  const argumentError = validatePrettierArguments(toolArgs);
  if (argumentError) return argumentError;
  try {
    const formatterOptions = { write: mode === "format", extraArgs: toolArgs };
    if (env !== process.env) formatterOptions.env = env;
    if (focusedScope) {
      const paths = await resolveFocusedFormatterPaths(root, focusedScope);
      if (!paths) {
        return "Focused formatting requires at least one resolved path.";
      }
      formatterOptions.paths = paths;
    }
    const result = await runFormatter(root, formatterOptions);
    if (result.code !== 0) {
      return createFormatterDiagnostic("Prettier failed", [result.stdout, result.stderr], env);
    }
    return "";
  } catch (error) {
    return createFormatterDiagnostic("Prettier could not be started", [error.message], env);
  }
}
