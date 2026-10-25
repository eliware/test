import { scanCommonJsFiles } from "./scan-commonjs-files.mjs";

export async function findCommonJsSourceUses(root, files, parseAst, scan = scanCommonJsFiles) {
  try {
    return await scan(root, files, parseAst);
  } catch (error) {
    return [`Repository modules could not be inspected for native ESM: ${error.message}`];
  }
}
