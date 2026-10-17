import { parse } from "@babel/parser";
import { expectedLicense } from "../../E-0.1.0.1.1/validate/required-package-files.mjs";
import { windowsProcessTreeFallbackScript } from "../../../../validation/shared/process/run/windows-process-tree-fallback.mjs";
import { countWords } from "../word-tools.mjs";
import { isSqlStatement } from "./is-sql-statement.mjs";

const commandStart = /^(?:npm|node|git|gh|npx|yarn|pnpm|powershell|pwsh)\s/iu;

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

function visit(value, blocks, parent = null) {
  if (!value || typeof value !== "object") return;
  if (isExactRequiredText(value) || isPowerShellScript(value)) return;
  if (parent?.type === "JSXAttribute" && parent.name?.name === "transform") return;
  if (value.type === "StringLiteral" && hasProse(value.value)) {
    blocks.push({ text: value.value, line: value.loc.start.line, kind: "prose" });
  } else if (value.type === "TemplateLiteral") {
    const text = staticTemplateText(value);
    if (text !== undefined) {
      if (hasProse(text)) blocks.push({ text, line: value.loc.start.line, kind: "prose" });
      return;
    }
    const quasis = value.quasis.map(({ value: part }) => part.cooked ?? part.raw).join("");
    if (hasProse(quasis)) blocks.push({ text: quasis, line: value.loc.start.line, kind: "prose" });
  } else if (value.type === "JSXText" && hasProse(value.value)) {
    blocks.push({ text: value.value, line: value.loc.start.line, kind: "prose" });
  }
  for (const [key, child] of Object.entries(value)) {
    if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key)) continue;
    if (Array.isArray(child)) child.forEach((item) => visit(item, blocks, value));
    else visit(child, blocks, value);
  }
}

function staticTemplateText(template) {
  let text = "";
  for (let index = 0; index < template.quasis.length; index += 1) {
    const part = template.quasis[index].value;
    text += part.cooked ?? part.raw;
    if (index < template.expressions.length) {
      const expression = staticStringValue(template.expressions[index]);
      if (expression === undefined) return undefined;
      text += expression;
    }
  }
  return text;
}

function staticStringValue(expression) {
  if (!expression || typeof expression !== "object") return undefined;
  if (expression.type === "StringLiteral") return expression.value;
  if (expression.type === "TemplateLiteral") return staticTemplateText(expression);
  if (expression.type === "BinaryExpression" && expression.operator === "+") {
    const left = staticStringValue(expression.left);
    const right = staticStringValue(expression.right);
    return left === undefined || right === undefined ? undefined : left + right;
  }
  return undefined;
}

function isExactRequiredText(value) {
  return (
    value.type === "VariableDeclarator" &&
    value.id?.name === "expectedLicense" &&
    staticStringValue(value.init) === expectedLicense
  );
}

function isPowerShellScript(value) {
  return (
    value.type === "VariableDeclarator" &&
    value.id?.name === "windowsProcessTreeFallbackScript" &&
    staticStringValue(value.init) === windowsProcessTreeFallbackScript
  );
}

function hasProse(value) {
  const text = value.trim();
  return (
    /\s/u.test(text) && countWords(text) > 1 && !commandStart.test(text) && !isSqlStatement(text)
  );
}
