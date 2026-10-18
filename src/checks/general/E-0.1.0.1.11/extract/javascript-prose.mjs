import { parse } from "@babel/parser";
import { expectedLicense } from "../../E-0.1.0.1.1/validate/required-package-files.mjs";
import { windowsProcessTreeFallbackScript } from "../../../../validation/shared/process/run/windows-process-tree-fallback.mjs";
import { isEmbeddedJavaScriptSource } from "./is/embedded-javascript-source.mjs";
import { isHttpHeaderValue } from "./is/http-header-value.mjs";
import { isHumanReadableProse } from "./is/human-readable-prose.mjs";
import { isSqlQueryArgument } from "./is/sql/query-argument.mjs";
import { isSvgTransformValue } from "./is/svg-transform-value.mjs";
import { isUserAgentValue } from "./is-user-agent-value.mjs";
import { staticStringValue, staticTemplateText } from "./javascript-prose/static-template-text.mjs";

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
  if (isUserAgentValue(value, parent)) return;
  if (isSvgTransformValue(value, parent)) return;
  if (isSqlQueryArgument(value, parent) || isHttpHeaderValue(value, parent)) return;
  if (value.type === "StringLiteral" && isHumanReadableProse(value.value)) {
    blocks.push({ text: value.value, line: value.loc.start.line, kind: "prose" });
  } else if (value.type === "TemplateLiteral") {
    const text = staticTemplateText(value);
    if (isEmbeddedJavaScriptSource(text)) return;
    if (text !== undefined) {
      if (isHumanReadableProse(text))
        blocks.push({ text, line: value.loc.start.line, kind: "prose" });
      return;
    }
    const quasis = value.quasis.map(({ value: part }) => part.cooked ?? part.raw).join("");
    if (isHumanReadableProse(quasis))
      blocks.push({ text: quasis, line: value.loc.start.line, kind: "prose" });
  } else if (value.type === "JSXText" && isHumanReadableProse(value.value)) {
    blocks.push({ text: value.value, line: value.loc.start.line, kind: "prose" });
  }
  for (const [key, child] of Object.entries(value)) {
    if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key)) continue;
    if (Array.isArray(child)) child.forEach((item) => visit(item, blocks, value));
    else visit(child, blocks, value);
  }
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
