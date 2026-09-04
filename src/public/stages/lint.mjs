export async function validateLint(runLintCommand) {
  const result = await runLintCommand();
  return Number.isInteger(result) ? result : (Number.isInteger(result?.code) ? result.code : 1);
}
