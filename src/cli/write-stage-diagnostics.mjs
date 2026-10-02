export function writeStageDiagnostics(result, write, debugTiming = false) {
  for (const diagnostic of result.diagnostics ?? []) {
    if (debugTiming && diagnostic.includes("Jest failed; see the inline suite failures above."))
      continue;
    write(diagnostic);
  }
  if (result.output) write(result.output);
}
