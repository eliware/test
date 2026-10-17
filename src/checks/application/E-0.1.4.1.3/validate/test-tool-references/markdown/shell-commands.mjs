export function extractMarkdownShellCommands(content) {
  const lines = content.split(/\r?\n/u);
  const commands = [];
  let fence = null;
  let shellBlock = false;
  for (const line of lines) {
    const opening = line.match(/^\s*(`{3,}|~{3,})\s*([\w+-]*)/u);
    if (!fence && opening) {
      fence = opening[1][0].repeat(opening[1].length);
      shellBlock = /^(?:sh|bash|shell|zsh|pwsh|powershell)$/iu.test(opening[2]);
      continue;
    }
    if (fence && line.trimStart().startsWith(fence)) {
      fence = null;
      shellBlock = false;
      continue;
    }
    if (fence && shellBlock) commands.push(line);
  }
  return commands.join("\n");
}
