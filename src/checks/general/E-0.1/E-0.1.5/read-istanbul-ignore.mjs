export function hasIstanbulIgnoreDirective(source) {
  let state = "code";
  let comment = "";
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (state === "code") {
      if (character === "'" || character === '"' || character === "`") state = character;
      else if (character === "/" && next === "/") {
        state = "line-comment";
        comment = "";
        index += 1;
      } else if (character === "/" && next === "*") {
        state = "block-comment";
        comment = "";
        index += 1;
      }
      continue;
    }
    if (state === "line-comment") {
      if (character === "\n" || character === "\r") {
        if (/\bistanbul\s+ignore\b/i.test(comment)) return true;
        state = "code";
      } else comment += character;
      continue;
    }
    if (state === "block-comment") {
      if (character === "*" && next === "/") {
        if (/\bistanbul\s+ignore\b/i.test(comment)) return true;
        state = "code";
        index += 1;
      } else comment += character;
      continue;
    }
    if (character === "\\") {
      index += 1;
    } else if (character === state) {
      state = "code";
    }
  }
  return /\bistanbul\s+ignore\b/i.test(comment);
}
