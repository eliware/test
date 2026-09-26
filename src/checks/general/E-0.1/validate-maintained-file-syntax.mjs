import { readFile } from "node:fs/promises";
import { parse } from "@babel/parser";
import { parse as parseYaml } from "yaml";
import prettier from "prettier";
import { join } from "node:path";

const parsers = new Map([
  [".mjs", (source) => parse(source, { sourceType: "module" })],
  [".json", (source) => JSON.parse(source)],
  [".yml", (source) => parseYaml(source)],
  [".yaml", (source) => parseYaml(source)],
  [".md", (source) => prettier.format(source, { parser: "markdown" })],
]);

export async function validateMaintainedFileSyntax(
  root,
  files,
  { read = readFile, syntaxParsers = parsers } = {},
) {
  const failures = [];
  for (const file of files) {
    const extension = file.slice(file.lastIndexOf(".")).toLowerCase();
    const parseFile = syntaxParsers.get(extension);
    if (!parseFile) continue;
    try {
      await parseFile(await read(join(root, file), "utf8"));
    } catch (error) {
      failures.push(`${file}: ${error.message}`);
    }
  }
  return failures;
}
