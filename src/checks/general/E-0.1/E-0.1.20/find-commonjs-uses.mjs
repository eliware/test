import { collectCommonJsFindings } from "./commonjs-ast-analysis.mjs";
import { scanCommonJsFiles } from "./scan-commonjs-files.mjs";

export function walk(node, findings, file) {
  return collectCommonJsFindings(node, findings, file);
}

export async function findCommonJsUses(root, packageJson, repositoryFiles, parseAst) {
  const findings = await scanCommonJsFiles(root, repositoryFiles, parseAst);
  const serialized = JSON.stringify(packageJson ?? {});
  if (/(?:^|["'])[^"']+\.(?:cjs|cts)(?:["']|$)/i.test(serialized))
    findings.push("package.json: CommonJS entrypoint or export");
  return [...new Set(findings)];
}
