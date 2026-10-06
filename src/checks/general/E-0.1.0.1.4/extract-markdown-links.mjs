const pattern =
  /!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)|\b(?:href|src)=["']([^"']+)["']|<((?:https?|mailto):[^ >]+)>/giu;

export function extractMarkdownLinks(content) {
  const markdown = removeMarkdownCode(content);
  const definitions = new Map();
  for (const [, label, target] of markdown.matchAll(/^ {0,3}\[([^\]]+)\]:\s*(\S+)/gimu))
    definitions.set(normalizeLabel(label), target);
  const links = [...markdown.matchAll(pattern)].map((match) => ({
    index: match.index,
    reference: match[1] ?? match[2] ?? match[3],
  }));
  const referenceText = markdown.replace(/^ {0,3}\[[^\]]+\]:[^\r\n]*/gimu, (line) =>
    " ".repeat(line.length),
  );
  for (const match of referenceText.matchAll(/!?\[([^\]]+)\](?:\[([^\]]*)\])?/gu)) {
    if (referenceText[match.index + match[0].length] === "(") continue;
    const label = normalizeLabel(match[2] || match[1]);
    const isReferenceSyntax = match[2] !== undefined || definitions.has(label);
    if (isReferenceSyntax)
      links.push({ index: match.index, reference: definitions.get(label) ?? null });
  }
  return links
    .sort((left, right) => left.index - right.index)
    .map(({ reference }) => ({ reference }));
}

function normalizeLabel(value) {
  return value.trim().replace(/\s+/gu, " ").toLowerCase();
}

export function removeMarkdownCode(content, { preserveInlineCodeText = false } = {}) {
  const lines = content.split(/\r?\n/u);
  let fence;
  let previousLine = "";
  for (let index = 0; index < lines.length; index += 1) {
    const opening = /^ {0,3}(`{3,}|~{3,})/u.exec(lines[index]);
    if (!fence && opening) {
      fence = { marker: opening[1][0], length: opening[1].length };
      lines[index] = "";
    } else if (fence) {
      if (new RegExp(`^ {0,3}${fence.marker}{${fence.length},}\\s*$`, "u").test(lines[index]))
        fence = undefined;
      lines[index] = "";
    } else if (isIndentedCode(lines[index], previousLine)) {
      lines[index] = "";
    }
    if (lines[index].trim()) previousLine = lines[index];
  }
  return lines
    .join("\n")
    .replace(/(`+)([^`]*?)\1/gu, preserveInlineCodeText ? "$2" : "")
    .replace(/<!--[\s\S]*?-->/gu, (comment) => comment.replace(/[^\n]/gu, ""));
}

function isIndentedCode(line, previousLine) {
  if (!/^(?: {4,}|\t)/u.test(line)) return false;
  const content = line.replace(/^(?: {4}|\t)/u, "");
  const priorListItem = /^\s*(?:[-+*]|\d+[.)])\s/u.test(previousLine);
  return !(priorListItem && /^(?:[-+*]|\d+[.)])\s/u.test(content));
}
