import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "@babel/parser";
import {
  moduleParserOptions,
  repositorySourceParserOptions,
} from "../../../create-repository-ast-cache.mjs";
import { collectAstReferences } from "./collect-ast-dependency-references.mjs";

const sourceFile = /\.(?:mjs|js|cjs|ts|tsx|cts)$/iu;
const processMethods = new Set(["execFile", "execFileSync", "spawn", "spawnSync"]);

function collectBinaryExecutionReferences(node, dependencyBinaries, referenced) {
  let hasProcessCall = false;
  const values = [];
  const visit = (current) => {
    if (current.type === "CallExpression") {
      const callee = current.callee;
      const name = callee?.name ?? callee?.property?.name;
      if (processMethods.has(name)) hasProcessCall = true;
    }
    if (current.type === "StringLiteral") values.push(current.value);
    if (current.type === "TemplateElement") values.push(current.value.raw);
    for (const [key, value] of Object.entries(current)) {
      if (["loc", "start", "end"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  };
  visit(node);
  if (!hasProcessCall) return;
  for (const [binary, dependency] of dependencyBinaries) {
    const escaped = binary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(?:^|[/\\\\])node_modules[/\\\\]\\.bin[/\\\\]${escaped}(?:\\.cmd)?(?:$|[^\\w.-])`,
      "i",
    );
    if (values.some((value) => pattern.test(value))) referenced.add(dependency);
  }
}

export async function scanSourceDependencyFiles(
  root,
  files,
  declared,
  referenced,
  uncertain,
  parseAst = null,
  dependencyBinaries = new Map(),
) {
  for (const file of files) {
    if (!sourceFile.test(file)) continue;
    try {
      const options = file.endsWith(".mjs") ? moduleParserOptions : repositorySourceParserOptions;
      const ast = parseAst
        ? await parseAst(root, file, options)
        : parse(await readFile(join(root, file), "utf8"), options);
      collectAstReferences(ast, declared, referenced, uncertain);
      collectBinaryExecutionReferences(ast, dependencyBinaries, referenced);
    } catch {
      /* Invalid source is reported by the syntax checks. */
    }
  }
}
