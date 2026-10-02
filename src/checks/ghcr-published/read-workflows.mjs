import { loadWorkflows } from "./load-workflows.mjs";

export function readWorkflows(root, context) {
  return loadWorkflows(root, context?.repositoryInventory);
}
