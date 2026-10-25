import { cleanMarkdownProseLine } from "./markdown/clean-line.mjs";
import { createProseParagraphCollector } from "./paragraph-collector.mjs";

export function extractMarkdownProse(source) {
  const lines = source.replace(/\r\n?/gu, "\n").split("\n");
  const paragraphs = createProseParagraphCollector();
  let fence = null;
  let htmlComment = false;

  for (const [index, rawLine] of lines.entries()) {
    const marker = rawLine.match(/^\s{0,3}(`{3,}|~{3,})/u)?.[1];
    if (marker) {
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      paragraphs.flush();
      continue;
    }
    if (fence) continue;
    const cleaned = cleanMarkdownProseLine(rawLine, htmlComment);
    htmlComment = cleaned.htmlComment;
    const line = cleaned.text;
    if (!line) {
      paragraphs.flush();
      continue;
    }
    const boundary = /^\s{0,3}(?:#{1,6}\s|[-+*]\s|\d+[.)]\s|\|)/u.test(rawLine);
    if (boundary) paragraphs.flush();
    paragraphs.append(line, index + 1);
    if (boundary) paragraphs.flush();
  }
  return paragraphs.finish();
}
