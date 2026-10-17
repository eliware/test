export function extractPlainTextProse(source) {
  const blocks = [];
  let lines = [];
  let firstLine = 1;
  const flush = () => {
    const text = lines.join(" ").trim();
    if (text) blocks.push({ text, line: firstLine, kind: "paragraph" });
    lines = [];
  };
  for (const [index, line] of source.replace(/\r\n?/gu, "\n").split("\n").entries()) {
    if (!line.trim()) {
      flush();
      firstLine = index + 2;
    } else {
      if (!lines.length) firstLine = index + 1;
      lines.push(line.trim());
    }
  }
  flush();
  return blocks;
}
