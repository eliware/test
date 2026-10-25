import { cleanMarkdownProseLine } from "./markdown/clean-line.mjs";

export function extractMarkdownProse(source) {
  const lines = source.replace(/\r\n?/gu, "\n").split("\n");
  const blocks = [];
  let fence = null;
  let htmlComment = false;
  let current = null;
  const flush = () => {
    if (current?.text.trim()) blocks.push(current);
    current = null;
  };

  for (const [index, rawLine] of lines.entries()) {
    const marker = rawLine.match(/^\s{0,3}(`{3,}|~{3,})/u)?.[1];
    if (marker) {
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      flush();
      continue;
    }
    if (fence) continue;
    const cleaned = cleanMarkdownProseLine(rawLine, htmlComment);
    htmlComment = cleaned.htmlComment;
    const line = cleaned.text;
    if (!line) {
      flush();
      continue;
    }
    const boundary = /^\s{0,3}(?:#{1,6}\s|[-+*]\s|\d+[.)]\s|\|)/u.test(rawLine);
    if (boundary) flush();
    if (!current) current = { text: line, line: index + 1, kind: "paragraph" };
    else current.text += ` ${line}`;
    if (boundary) flush();
  }
  flush();
  return blocks;
}
