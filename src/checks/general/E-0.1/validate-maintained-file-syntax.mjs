import { readFile } from "node:fs/promises";
import { parse } from "@babel/parser";
import { moduleParserOptions } from "../../create-repository-ast-cache.mjs";
import { parse as parseYaml } from "yaml";
import prettier from "prettier";
import { join } from "node:path";

const parsers = new Map([
  [".mjs", (source) => parse(source, { sourceType: "module" })],
  [".js", (source) => parse(source, { sourceType: "unambiguous", plugins: ["jsx"] })],
  [".cjs", (source) => parse(source, { sourceType: "script", allowReturnOutsideFunction: true })],
  [".jsx", (source) => parse(source, { sourceType: "unambiguous", plugins: ["jsx"] })],
  [".ts", (source) => parse(source, { sourceType: "module", plugins: ["typescript"] })],
  [".tsx", (source) => parse(source, { sourceType: "module", plugins: ["typescript", "jsx"] })],
  [".json", (source) => JSON.parse(source)],
  [".yml", (source) => parseYaml(source)],
  [".yaml", (source) => parseYaml(source)],
  [".md", (source) => prettier.format(source, { parser: "markdown" })],
]);
const requiredExtensions = new Set([".mjs", ".json", ".yml", ".yaml", ".md"]);

export async function validateMaintainedFileSyntax(
  root,
  files,
  { read = readFile, syntaxParsers = parsers, parseAst } = {},
) {
  const failures = [];
  for (const file of files) {
    const extension = file.slice(file.lastIndexOf(".")).toLowerCase();
    const parseFile = syntaxParsers.get(extension);
    if (!parseFile) {
      if (requiredExtensions.has(extension))
        failures.push(`${file}: no syntax parser is configured for maintained ${extension} files.`);
      continue;
    }
    try {
      if (extension === ".mjs" && parseAst) await parseAst(root, file, moduleParserOptions);
      else await parseFile(await read(join(root, file), "utf8"));
    } catch (error) {
      failures.push(`${file}: ${error.message}`);
    }
  }
  return failures;
}
