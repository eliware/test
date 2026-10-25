import { createProseParagraphCollector } from "./paragraph-collector.mjs";

export function extractPlainTextProse(source) {
  const paragraphs = createProseParagraphCollector();
  for (const [index, line] of source.replace(/\r\n?/gu, "\n").split("\n").entries()) {
    if (!line.trim()) paragraphs.flush();
    else paragraphs.append(line, index + 1);
  }
  return paragraphs.finish();
}
