import { loadWorkflows } from "./load-workflows.mjs";

const workflowsByContext = new WeakMap();
const workflowsByInventory = new WeakMap();

export function readWorkflows(root, context) {
  if (context?.repositoryInventory) {
    const inventory = context.repositoryInventory;
    const cached = workflowsByInventory.get(inventory);
    if (cached) return cached;
    const pending = loadWorkflows(root, inventory);
    workflowsByInventory.set(inventory, pending);
    return pending;
  }
  if (context && typeof context === "object") {
    const cached = workflowsByContext.get(context);
    if (cached) return cached;
    const pending = loadWorkflows(root);
    workflowsByContext.set(context, pending);
    return pending;
  }
  return loadWorkflows(root);
}
