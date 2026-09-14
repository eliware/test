import { referencesResolve } from "./resolve-contract-graph.mjs";

export function validateContractGraph(contracts) {
  return referencesResolve(contracts)
    ? null
    : "Contract parent and dependency references must resolve without cycles.";
}
