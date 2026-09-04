export async function validateLint(runLintCommand, cwd, write) {
  const result = await runLintCommand({ cwd, write });
  return Number.isInteger(result) ? result : (Number.isInteger(result?.code) ? result.code : 1);
}
