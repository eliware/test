const pattern =
  /!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)|!?\[[^\]]+\]\[([^\]]+)\]|\b(?:href|src)=["']([^"']+)["']|<((?:https?|mailto):[^ >]+)>/giu;

export function extractMarkdownLinks(content) {
  const markdown = removeMarkdownCode(content);
  const definitions = new Map(
    [...markdown.matchAll(/^\s*\[([^\]]+)\]:\s*(\S+)/gim)].map((entry) => [
      entry[1].toLowerCase(),
      entry[2],
    ]),
  );
  return [...markdown.matchAll(pattern)]
    .map((match) => ({
      reference: match[1] ?? match[3] ?? match[4] ?? definitions.get(match[2]?.toLowerCase()),
      referenceLabel: match[2],
      bareReference: undefined,
    }))
    .filter(({ reference, referenceLabel }) => reference || referenceLabel);
}

function removeMarkdownCode(content) {
  const lines = content.split(/\r?\n/u);
  let fence;
  for (let index = 0; index < lines.length; index += 1) {
    const opening = /^ {0,3}(`{3,}|~{3,})/u.exec(lines[index]);
    if (!fence && opening) {
      fence = { marker: opening[1][0], length: opening[1].length };
      lines[index] = "";
      continue;
    }
    if (fence) {
      const closing = new RegExp(`^ {0,3}${fence.marker}{${fence.length},}\\s*$`, "u");
      if (closing.test(lines[index])) fence = undefined;
      lines[index] = "";
    }
  }
  return lines.join("\n").replace(/(`+)([^`]*?)\1/gu, "");
}
