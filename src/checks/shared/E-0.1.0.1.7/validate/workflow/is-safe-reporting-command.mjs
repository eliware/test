export function isSafeReportingCommand(command) {
  if (typeof command !== "string" || /[\r\n\\]/u.test(command)) return false;
  const match = command.trimStart().match(/^(?:echo|printf)(?=\s|$)/u);
  if (!match) return false;
  let index = command.length - command.trimStart().length + match[0].length;
  while (index < command.length) {
    if (/\s/u.test(command[index])) {
      index += 1;
      continue;
    }
    const quote = command[index];
    if (quote === "'" || quote === '"') {
      const end = command.indexOf(quote, index + 1);
      if (end < 0) return false;
      const text = command.slice(index + 1, end);
      if (quote === '"' && /[$`]/u.test(text)) return false;
      index = end + 1;
      if (index < command.length && !/\s/u.test(command[index])) return false;
      continue;
    }
    const token = command.slice(index).match(/^[\w./:@=+-]+/u)?.[0];
    if (!token) return false;
    index += token.length;
  }
  return true;
}
