export function writeStageDiagnostics(result, write) {
  for (const diagnostic of result.diagnostics ?? []) write(diagnostic);
  if (result.output) write(result.output);
}
