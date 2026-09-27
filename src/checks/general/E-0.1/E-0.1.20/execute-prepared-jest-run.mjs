export function executePreparedJestRun(prepared, execute) {
  return execute(prepared.command, prepared.args, prepared.options);
}
