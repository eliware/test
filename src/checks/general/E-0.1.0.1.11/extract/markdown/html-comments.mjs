export function removeMarkdownHtmlComments(line, htmlComment) {
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
