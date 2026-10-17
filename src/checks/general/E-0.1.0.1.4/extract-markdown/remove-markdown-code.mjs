export function removeMarkdownCode(content, { preserveInlineCodeText = false } = {}) {
  const lines = content.split(/\r?\n/u);
  let fence;
  let previousLine = "";
  for (let index = 0; index < lines.length; index += 1) {
    const content = removeBlockquotePrefixes(lines[index]);
    const opening = /^ {0,3}(`{3,}|~{3,})/u.exec(content);
    if (!fence && opening) {
      fence = { marker: opening[1][0], length: opening[1].length };
      lines[index] = "";
    } else if (fence) {
      if (new RegExp(`^ {0,3}${fence.marker}{${fence.length},}\\s*$`, "u").test(content))
        fence = undefined;
      lines[index] = "";
    } else if (isIndentedCode(content, previousLine)) {
      lines[index] = "";
    }
    if (lines[index].trim()) previousLine = content;
  }
  return lines
    .join("\n")
    .replace(/(`+)([^`]*?)\1/gu, preserveInlineCodeText ? "$2" : "")
    .replace(/<!--[\s\S]*?-->/gu, (comment) => comment.replace(/[^\n]/gu, ""));
}

function removeBlockquotePrefixes(line) {
  return line.replace(/^(?: {0,3}> ?)+/u, "");
}

function isIndentedCode(line, previousLine) {
  if (!/^(?: {4,}|\t)/u.test(line)) return false;
  const content = line.replace(/^(?: {4}|\t)/u, "");
  const priorListItem = /^\s*(?:[-+*]|\d+[.)])\s/u.test(previousLine);
  return !(priorListItem && /^(?:[-+*]|\d+[.)])\s/u.test(content));
}
