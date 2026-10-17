import { fail, pass } from "../check-result.mjs";
import { extractProse } from "./E-0.1.0.1.11/extract/prose.mjs";
import { findLanguageViolations } from "./E-0.1.0.1.11/find-language-violations.mjs";
import { loadUnapprovedDictionary } from "./E-0.1.0.1.11/load/unapproved-dictionary.mjs";
import { loadExactExamples } from "./E-0.1.0.1.11/load/exact-examples.mjs";

export const ruleId = "E-0.1.0.1.11";
const supportedExtensions = new Set(["md", "yaml", "yml", "json", "mjs", "js", "jsx"]);
const internalCodePath = /^(?:tests|test-fixtures|examples)\//u;

export async function run(context = {}, dependencies = {}) {
  const inventory = context.repositoryInventory;
  if (!inventory?.files || !inventory.readText)
    return fail(ruleId, "Repository language files could not be inspected.");
  try {
    const files = await inventory.files("repository");
    const exactSentences = await (dependencies.loadExactExamples ?? loadExactExamples)(
      dependencies.exampleFiles,
    );
    const dictionary = loadUnapprovedDictionary();
    const errors = [];
    for (const path of files) {
      if (!supportedExtensions.has(path.toLowerCase().split(".").at(-1))) continue;
      if (internalCodePath.test(path)) continue;
      const blocks = extractProse(path, await inventory.readText(path));
      errors.push(...findLanguageViolations(path, blocks, dictionary, exactSentences));
    }
    if (errors.some((error) => error.includes(". Suggested alternatives:")))
      errors.push(
        "The alternatives are examples. They are not requirements. Rewrite the text with grammatical wording that omits the listed term.",
      );
    return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
  } catch (error) {
    return fail(ruleId, `Repository language files could not be inspected: ${error.message}`);
  }
}
