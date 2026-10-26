import { removeMarkdownHtmlComments } from "./html-comments.mjs";

export function cleanMarkdownProseLine(rawLine, htmlComment) {
  const cleaned = removeMarkdownHtmlComments(rawLine, htmlComment);
  const text = cleaned.text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/gu, "$1")
    .replace(/`+[^`]*`+/gu, " ")
    .replace(/https?:\/\/\S+/giu, " ")
    .replace(/<[^>]*>/gu, " ")
    .replace(/^\s{0,3}#{1,6}\s+/u, "")
    .replace(/^\s{0,3}>\s?/u, "")
    .replace(/^\s*(?:[-+*]|\d+[.)])\s+/u, "")
    .replace(/[*_~]/gu, "")
    .replace(/\|/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  return { text, htmlComment: cleaned.htmlComment };
}
