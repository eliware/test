import { parse } from "@babel/parser";
import { parseAllDocuments } from "yaml";
import prettier from "prettier";
import { moduleParserOptions } from "../../create-repository-ast-cache.mjs";

const parserByExtension = new Map([
  [".mjs", (source) => parse(source, moduleParserOptions)],
  [".js", (source) => parse(source, { sourceType: "unambiguous", plugins: ["jsx"] })],
  [".cjs", (source) => parse(source, { sourceType: "script", allowReturnOutsideFunction: true })],
  [".jsx", (source) => parse(source, { sourceType: "unambiguous", plugins: ["jsx"] })],
  [".ts", (source) => parse(source, { sourceType: "module", plugins: ["typescript"] })],
  [".tsx", (source) => parse(source, { sourceType: "module", plugins: ["typescript", "jsx"] })],
  [".json", (source) => JSON.parse(source)],
  [".yml", (source) => parseYamlStream(source)],
  [".yaml", (source) => parseYamlStream(source)],
  [".md", (source) => prettier.format(source, { parser: "markdown" })],
]);

export const requiredSyntaxExtensions = new Set([".mjs", ".json", ".yml", ".yaml", ".md"]);

function parseYamlStream(source) {
  const documents = parseAllDocuments(source);
  const error = documents.flatMap((document) => document.errors)[0];
  if (error) throw error;
  return documents;
}

export function selectMaintainedFileSyntaxParser(file, syntaxParsers = parserByExtension) {
  const extension = file.slice(file.lastIndexOf(".")).toLowerCase();
  return { extension, parse: syntaxParsers.get(extension) ?? null };
}
