export function cleanMarkdownProseLine(rawLine, htmlComment) {
  const cleaned = removeHtmlComments(rawLine, htmlComment);
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

function removeHtmlComments(line, htmlComment) {
  let output = "";
  let cursor = 0;
  let inComment = htmlComment;
  while (cursor < line.length) {
    if (!inComment) {
      const start = line.indexOf("<!--", cursor);
      if (start < 0) {
        output += line.slice(cursor);
        break;
      }
      output += line.slice(cursor, start);
      cursor = start + 4;
      inComment = true;
    } else {
      const end = line.indexOf("-->", cursor);
      if (end < 0) {
        cursor = line.length;
        break;
      }
      cursor = end + 3;
      inComment = false;
    }
  }
  return { text: output, htmlComment: inComment };
}
