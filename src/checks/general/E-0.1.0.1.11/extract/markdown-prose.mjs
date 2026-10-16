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
    let line = removeHtmlComments(
      rawLine,
      (value) => {
        htmlComment = value;
      },
      () => htmlComment,
    );
    line = line
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

function removeHtmlComments(line, setCommentState, getCommentState) {
  let output = "";
  let cursor = 0;
  let inComment = getCommentState();
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
  setCommentState(inComment);
  return output;
}
