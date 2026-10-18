import { parse } from "@babel/parser";
import {
  collectOutputText,
  isUserFacingAttribute,
  isUserFacingOutputCall,
  isUserFacingOutputProperty,
} from "./javascript-prose/output-context.mjs";

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
  const blocks = ast.comments.map((comment) => ({
    text: comment.value,
    line: comment.loc.start.line,
    kind: "prose",
  }));
  visit(ast.program, blocks);
  return blocks;
}

function addText(value, line, blocks) {
  const texts = collectOutputText(value);
  for (const text of texts) {
    if (text.trim()) blocks.push({ text, line, kind: "prose" });
  }
}

function visit(value, blocks) {
  if (!value || typeof value !== "object") return;
  if (value.type === "JSXText") {
    addText(value.value, value.loc.start.line, blocks);
    return;
  }
  if (value.type === "JSXAttribute") {
    if (isUserFacingAttribute(value.name?.name)) {
      const expression =
        value.value?.type === "JSXExpressionContainer" ? value.value.expression : value.value;
      addText(expression, value.loc.start.line, blocks);
    }
    return;
  }
  if (value.type === "CallExpression" && isUserFacingOutputCall(value.callee)) {
    for (const argument of value.arguments) addText(argument, value.loc.start.line, blocks);
  }
  if (value.type === "AssignmentExpression" && isUserFacingOutputProperty(value.left)) {
    addText(value.right, value.loc.start.line, blocks);
  }
  if (value.type === "CallExpression" && isSetAttributeOutput(value)) {
    addText(value.arguments[1], value.loc.start.line, blocks);
  }
  for (const [key, child] of Object.entries(value)) {
    if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key)) continue;
    if (Array.isArray(child)) child.forEach((item) => visit(item, blocks));
    else visit(child, blocks);
  }
}

function isSetAttributeOutput(call) {
  return (
    call.callee?.type === "MemberExpression" &&
    !call.callee.computed &&
    call.callee.property?.name === "setAttribute" &&
    call.arguments[0]?.type === "StringLiteral" &&
    isUserFacingAttribute(call.arguments[0].value)
  );
}
