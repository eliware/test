import { parse } from "@babel/parser";
import { countWords } from "../word-tools.mjs";

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

function visit(value, blocks) {
  if (!value || typeof value !== "object") return;
  if (isExactRequiredText(value) || isPowerShellScript(value)) return;
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
    if (Array.isArray(child)) child.forEach((item) => visit(item, blocks));
    else visit(child, blocks);
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
  if (expression.type === "StringLiteral") return expression.value;
  if (expression.type === "TemplateLiteral") return staticTemplateText(expression);
  return undefined;
}

function isExactRequiredText(value) {
  if (value.type !== "VariableDeclarator" || value.id?.name !== "expectedLicense") return false;
  return true;
}

function isPowerShellScript(value) {
  if (value.type !== "VariableDeclarator" || value.id?.name !== "script") return false;
  return JSON.stringify(value.init).includes("Get-CimInstance");
}

function hasProse(value) {
  const text = value.trim();
  return /\s/u.test(text) && countWords(text) > 1 && !commandStart.test(text);
}
