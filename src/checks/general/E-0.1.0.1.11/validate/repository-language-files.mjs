import { extractProse } from "../extract/prose.mjs";
import { findLanguageViolations } from "../find/language-violations.mjs";

const supportedExtensions = new Set(["md", "txt", "yaml", "yml", "json", "mjs", "js", "jsx"]);
const internalCodePath = /^(?:tests|test-fixtures|examples)\//u;

export async function validateRepositoryLanguageFiles(files, inventory, dictionary, examples) {
  const errors = [];
  for (const path of files) {
    if (!supportedExtensions.has(path.toLowerCase().split(".").at(-1))) continue;
    if (internalCodePath.test(path)) continue;
    const blocks = extractProse(path, await inventory.readText(path));
    errors.push(...findLanguageViolations(path, blocks, dictionary, examples));
  }
  return errors;
}
