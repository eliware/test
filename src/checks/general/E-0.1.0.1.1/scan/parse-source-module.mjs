import { parse } from "@babel/parser";
import {
  moduleParserOptions,
  repositorySourceParserOptions,
} from "../../../../validation/shared/ast/create-repository-ast/cache.mjs";
import { collectCommonJsFindings } from "../collect-commonjs/findings.mjs";

export async function scanCommonJsSourceModule({ root, file, parseAst, readSource }) {
  const findings = [];
  try {
    const options = file.endsWith(".mjs") ? moduleParserOptions : repositorySourceParserOptions;
    const ast = parseAst
      ? await parseAst(root, file, options)
      : parse(await readSource(file, root), options);
    collectCommonJsFindings(ast, findings, file);
  } catch (error) {
    findings.push(`${file}: invalid module syntax (${error.message})`);
  }
  return findings;
}
