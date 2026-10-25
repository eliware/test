import { scanCommonJsFiles } from "./scan-commonjs-files.mjs";
import { hasCommonJsPackageEntrypoint } from "./find-commonjs/package-entrypoints.mjs";

export async function findCommonJsUses(root, packageJson, files, parseAst) {
  let findings;
  try {
    findings = await scanCommonJsFiles(root, files, parseAst);
  } catch (error) {
    return [`Repository modules could not be inspected for native ESM: ${error.message}`];
  }
  if (hasCommonJsPackageEntrypoint(packageJson))
    findings.push("package.json: CommonJS entrypoint or export");
  return [...new Set(findings)];
}
