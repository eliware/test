const commandPrefix = /^(?:(?:[A-Z_][A-Z\d_]*=\S+)\s+)*(?:command\s+|exec\s+)?/iu;

export function splitTestCommandChain(value) {
  return value.split(/&&|\|\||[;|]/u).map((part) => part.trim());
}

export function normalizeCommandPrefix(command) {
  return command.replace(commandPrefix, "");
}
