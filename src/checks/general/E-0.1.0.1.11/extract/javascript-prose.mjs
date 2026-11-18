import { parse } from "@babel/parser";
import extractJavaScriptComments from "./javascript-prose/comments.mjs";
import collectJavaScriptProse from "./javascript-prose/collect.mjs";
export default function extractJavaScriptProse(source, parserOptions = {}) {
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
  const comments = extractJavaScriptComments(ast.comments);
  return [...comments, ...collectJavaScriptProse(ast.program)];
}
