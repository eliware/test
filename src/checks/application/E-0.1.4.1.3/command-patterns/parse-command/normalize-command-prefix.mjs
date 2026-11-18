const commandPrefix = /^(?:(?:[A-Z_][A-Z\d_]*=\S+)\s+)*(?:command\s+|exec\s+)?/iu;
function normalizeCommandPrefix(command) {
  return command.replace(commandPrefix, "");
}
export default normalizeCommandPrefix;
