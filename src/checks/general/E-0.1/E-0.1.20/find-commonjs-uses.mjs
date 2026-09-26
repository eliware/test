import { collectCommonJsFindings } from "./commonjs-ast-analysis.mjs";
import { scanCommonJsFiles } from "./scan-commonjs-files.mjs";

export function walk(node, findings, file) {
  return collectCommonJsFindings(node, findings, file);
}

export async function findCommonJsUses(root, packageJson) {
  const findings = await scanCommonJsFiles(root);
  const serialized = JSON.stringify(packageJson ?? {});
  if (/(?:^|["'])[^"']+\.(?:cjs|cts)(?:["']|$)/i.test(serialized))
    findings.push("package.json: CommonJS entrypoint or export");
  return [...new Set(findings)];
}
