import { join } from "node:path";
import { fail, pass } from "../../../../check-result.mjs";
import { loadContractDocument } from "./load-contract-document.mjs";
import { validateContractGraph } from "./validate-contract-graph.mjs";
import { validateContractIndex } from "./validate-contract-index.mjs";
import { validateContractReferences } from "./validate-contract-references.mjs";
import { validateContractDocumentShape } from "./validate-contract-document-shape.mjs";
import { validateContractRecordShape } from "./validate-contract-record-shape.mjs";

export const ruleId = "A-1.25.1";
export const parentRuleId = "A-1.25.0";

export async function run({ root }) {
  const { contracts, index, error } = await loadContractDocument(root);
  if (error) return fail(ruleId, error);
  const documentError = validateContractDocumentShape(contracts);
  if (documentError) return fail(ruleId, documentError);
  const ids = new Set();
  for (const contract of contracts.contracts) {
    const shapeError = validateContractRecordShape(contract, ids);
    if (shapeError) return fail(ruleId, shapeError);
    const referenceError = await validateContractReferences({
      root,
      file: join(root, "specs", "contracts.json"),
      contract,
    });
    if (referenceError) return fail(ruleId, referenceError);
  }
  const graphError = validateContractGraph(contracts.contracts);
  if (graphError) return fail(ruleId, graphError);
  const indexError = validateContractIndex(index);
  if (indexError) return fail(ruleId, indexError);
  return pass(ruleId);
}
