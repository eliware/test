import { parse } from "@babel/parser";
import { collectJavaScriptProse } from "./javascript-prose/collect.mjs";

export function extractJavaScriptProse(source, parserOptions = {}) {
  let ast;
  try {
    ast = parse(source, {
      sourceType: "unambiguous",
      plugins: ["jsx"],
      ...parserOptions,
    });
  } catch {
    return [];
  }
  const comments = ast.comments.map((comment) => ({
    text: comment.value,
    line: comment.loc.start.line,
    kind: "prose",
  }));
  return [...comments, ...collectJavaScriptProse(ast.program)];
}
