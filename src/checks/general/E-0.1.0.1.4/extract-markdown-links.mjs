const pattern =
  /!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)|!?\[[^\]]+\]\[([^\]]+)\]|\b(?:href|src)=["']([^"']+)["']|<((?:https?|mailto):[^ >]+)>/giu;

export function extractMarkdownLinks(content) {
  const markdown = removeCode(content);
  const definitions = new Map(
    [...markdown.matchAll(/^\s*\[([^\]]+)\]:\s*(\S+)/gimu)].map((match) => [
      match[1].toLowerCase(),
      match[2],
    ]),
  );
  return [...markdown.matchAll(pattern)]
    .map((match) => ({
      reference: match[1] ?? match[3] ?? match[4] ?? definitions.get(match[2]?.toLowerCase()),
    }))
    .filter(({ reference }) => reference);
}

function removeCode(content) {
  const lines = content.split(/\r?\n/u);
  let fence;
  for (let index = 0; index < lines.length; index += 1) {
    const opening = /^ {0,3}(`{3,}|~{3,})/u.exec(lines[index]);
    if (!fence && opening) {
      fence = { marker: opening[1][0], length: opening[1].length };
      lines[index] = "";
    } else if (fence) {
      if (new RegExp(`^ {0,3}${fence.marker}{${fence.length},}\\s*$`, "u").test(lines[index]))
        fence = undefined;
      lines[index] = "";
    }
  }
  return lines.join("\n").replace(/(`+)([^`]*?)\1/gu, "");
}
