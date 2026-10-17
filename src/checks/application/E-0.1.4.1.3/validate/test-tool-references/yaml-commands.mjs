export function extractYamlCommands(content) {
  const lines = content.split(/\r?\n/u);
  const commands = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(\s*)(?:-\s*)?(?:run|command|script):\s*(.*)$/u);
    if (!match) continue;
    if (/^[|>][+-]?$/u.test(match[2]))
      index = appendBlockCommands(lines, index, match[1].length, commands);
    else commands.push(match[2].replace(/^("|')(.*)\1$/u, "$2"));
  }
  return commands.join("\n");
}

function appendBlockCommands(lines, index, keyIndent, commands) {
  let next = index + 1;
  while (next < lines.length && (!lines[next].trim() || indentation(lines[next]) > keyIndent)) {
    if (lines[next].trim()) commands.push(lines[next].trim());
    next += 1;
  }
  return next - 1;
}

function indentation(line) {
  return line.length - line.trimStart().length;
}
