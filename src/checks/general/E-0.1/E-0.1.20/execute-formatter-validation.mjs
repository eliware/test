import { validatePrettierArguments } from "../../../validate-prettier-arguments.mjs";
import { collectRedactionSecrets } from "../../../collect-redaction-secrets.mjs";
import { redactProcessOutput } from "../../../redact-process-output.mjs";
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
      const secrets = collectRedactionSecrets(env);
      const detail = [result.stdout, result.stderr]
        .filter(Boolean)
        .map((text) => redactProcessOutput(text, secrets))
        .join("\n")
        .trim();
      return detail ? `Prettier failed: ${detail}` : "Prettier failed without diagnostics.";
    }
    return "";
  } catch (error) {
    return `Prettier could not be started: ${redactProcessOutput(error.message, collectRedactionSecrets(env))}`;
  }
}
