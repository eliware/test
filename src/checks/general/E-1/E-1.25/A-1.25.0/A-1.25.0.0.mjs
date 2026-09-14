import { fail, pass } from "../../../../check-result.mjs";
import { loadStructuredJsonDocuments } from "./load-structured-json-documents.mjs";
import { validateStructuredDocumentReferences } from "./validate-structured-document-references.mjs";

export const ruleId = "A-1.25.0.0";
export const parentRuleId = "A-1.25.0";

export async function run({ root }) {
  try {
    const loaded = await loadStructuredJsonDocuments(root);
    if (loaded.error) return fail(ruleId, loaded.error);
    const error = await validateStructuredDocumentReferences({ root, documents: loaded.documents });
    if (error) return fail(ruleId, error);
  } catch (error) {
    return fail(
      ruleId,
      `Structured JSON references must be valid and resolvable: ${error.message}`,
    );
  }
  return pass(ruleId);
}
