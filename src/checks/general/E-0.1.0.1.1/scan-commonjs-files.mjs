import { findRepositoryFiles } from "../../../validation/shared/repository/find-repository-files.mjs";
import { scanCommonJsFile } from "./scan/commonjs-file.mjs";

export async function scanCommonJsFiles(root, files, parseAst) {
  const findings = [];
  const candidates = files ?? (await findRepositoryFiles(root));
  for (const file of candidates) findings.push(...(await scanCommonJsFile(root, file, parseAst)));
  return findings;
}
