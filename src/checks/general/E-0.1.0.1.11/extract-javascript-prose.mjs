import { parse } from "@babel/parser";
import { countWords } from "./word-tools.mjs";

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
  if (value.type === "StringLiteral" && hasProse(value.value)) {
    blocks.push({ text: value.value, line: value.loc.start.line, kind: "prose" });
  } else if (value.type === "TemplateLiteral") {
    const text = value.quasis.map(({ value: part }) => part.cooked ?? part.raw).join("");
    if (hasProse(text)) blocks.push({ text, line: value.loc.start.line, kind: "prose" });
  } else if (value.type === "JSXText" && hasProse(value.value)) {
    blocks.push({ text: value.value, line: value.loc.start.line, kind: "prose" });
  }
  for (const [key, child] of Object.entries(value)) {
    if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key)) continue;
    if (Array.isArray(child)) child.forEach((item) => visit(item, blocks));
    else visit(child, blocks);
  }
}

function hasProse(value) {
  const text = value.trim();
  return /\s/u.test(text) && countWords(text) > 1 && !commandStart.test(text);
}
