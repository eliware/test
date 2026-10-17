import { extractJavaScriptProse } from "./javascript-prose.mjs";
import { extractJsonProse } from "./json-prose.mjs";
import { extractMarkdownProse } from "./markdown-prose.mjs";
import { extractYamlProse } from "./yaml-prose.mjs";

export function extractProse(path, source) {
  const extension = path.toLowerCase().split(".").at(-1);
  if (extension === "md") return extractMarkdownProse(source);
  if (extension === "yaml" || extension === "yml") return extractYamlProse(source);
  if (extension === "json") return extractJsonProse(source);
  if (extension === "mjs" || extension === "js" || extension === "jsx")
    return extractJavaScriptProse(source);
  return [];
}
