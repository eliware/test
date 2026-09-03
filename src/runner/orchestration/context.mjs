export function normalizeRunnerArguments(argumentsList) {
  return argumentsList.filter((argument) => argument !== '--runInBand' && argument !== '--no-runInBand' && argument !== '--');
}

export function createStageContext(options) {
  return { cwd: options.cwd, sanitizeEnv: options.sanitizeEnv, write: options.write, runBuild: options.runBuild, runTypecheck: options.runTypecheck, runLintCommand: options.runLintCommand, runAudit: options.runAudit, runPack: options.runPack };
}
