import { extractJavaScriptProse } from "./extract-javascript-prose.mjs";
import { extractJsonProse } from "./extract-json-prose.mjs";
import { extractMarkdownProse } from "./extract-markdown-prose.mjs";
import { extractYamlProse } from "./extract-yaml-prose.mjs";

export function extractProse(path, source) {
  const extension = path.toLowerCase().split(".").at(-1);
  if (extension === "md") return extractMarkdownProse(source);
  if (extension === "yaml" || extension === "yml") return extractYamlProse(source);
  if (extension === "json") return extractJsonProse(source);
  if (extension === "mjs" || extension === "js") return extractJavaScriptProse(source);
  return [];
}
