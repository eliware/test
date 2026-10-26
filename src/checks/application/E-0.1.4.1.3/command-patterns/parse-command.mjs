const commandPrefix = /^(?:(?:[A-Z_][A-Z\d_]*=\S+)\s+)*(?:command\s+|exec\s+)?/iu;

export function splitTestCommandChain(value) {
  const parts = [];
  let start = 0;
  let quote = null;
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote === "'") {
      if (character === "'") quote = null;
      continue;
    }
    if (quote === '"') {
      if (character === "\\") escaped = true;
      else if (character === '"') quote = null;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }
    if (character !== ";" && character !== "|") {
      if (character === "&" && value[index + 1] === "&") {
        parts.push(value.slice(start, index).trim());
        index += 1;
        start = index + 1;
      }
      continue;
    }
    parts.push(value.slice(start, index).trim());
    if (character === "|" && value[index + 1] === "|") index += 1;
    start = index + 1;
  }
  parts.push(value.slice(start).trim());
  return parts;
}

export function normalizeCommandPrefix(command) {
  return command.replace(commandPrefix, "");
}
