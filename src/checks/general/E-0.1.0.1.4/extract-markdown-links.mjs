const pattern =
  /!?\[[^\]]*\]\((<[^>\r\n]+>|[^)\s]+)(?:\s+[^)]*)?\)|\b(?:href|src)=["']([^"']+)["']|<((?:https?|mailto):[^ >]+)>/giu;

export function extractMarkdownLinks(content) {
  const markdown = removeMarkdownCode(content);
  const definitions = new Map();
  for (const [, label, angle, plain] of markdown.matchAll(
    /^ {0,3}\[([^\]]+)\]:\s*(?:<([^>\r\n]+)>|(\S+))/gimu,
  ))
    definitions.set(normalizeLabel(label), angle ?? plain);
  const links = [...markdown.matchAll(pattern)].map((match) => ({
    index: match.index,
    reference: stripAngleDestination(match[1]) ?? match[2] ?? match[3],
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

function stripAngleDestination(value) {
  if (!value) return value;
  return value.startsWith("<") && value.endsWith(">") ? value.slice(1, -1) : value;
}

function normalizeLabel(value) {
  return value.trim().replace(/\s+/gu, " ").toLowerCase();
}

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
