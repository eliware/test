import { readFile } from "node:fs/promises";
import { moduleParserOptions } from "../../create-repository-ast-cache.mjs";
import { join } from "node:path";
import {
  requiredSyntaxExtensions,
  selectMaintainedFileSyntaxParser,
} from "./maintained-file-syntax-parser.mjs";

export async function validateMaintainedFileSyntax(
  root,
  files,
  { read = readFile, syntaxParsers, parseAst } = {},
) {
  const failures = [];
  for (const file of files) {
    const { extension, parse: parseFile } = selectMaintainedFileSyntaxParser(file, syntaxParsers);
    if (!parseFile) {
      if (requiredSyntaxExtensions.has(extension))
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
