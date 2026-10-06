import { scanCommonJsFiles } from "./scan-commonjs-files.mjs";

export async function findCommonJsUses(root, packageJson, files, parseAst) {
  let findings;
  try {
    findings = await scanCommonJsFiles(root, files, parseAst);
  } catch (error) {
    return [`Repository modules could not be inspected for native ESM: ${error.message}`];
  }
  if (/(?:^|["'])[^"']+\.(?:cjs|cts)(?:["']|$)/iu.test(JSON.stringify(packageJson ?? {})))
    findings.push("package.json: CommonJS entrypoint or export");
  return [...new Set(findings)];
}
