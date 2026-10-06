export function redactChildProcessError(error, output, capturedOutput) {
  const safeError = new Error(output.redactDiagnostic(error?.message ?? String(error)));
  // Copy only standard fields after redaction; custom properties and causes stay private.
  safeError.name = output.redactDiagnostic(typeof error?.name === "string" ? error.name : "Error");
  if (typeof error?.code === "string") safeError.code = output.redactDiagnostic(error.code);
  safeError.stdout = capturedOutput.stdout;
  safeError.stderr = capturedOutput.stderr;
  return safeError;
}
