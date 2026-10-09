import { fail, pass } from "../check-result.mjs";
import { validateMcpToolFiles } from "./E-0.1.8.1.1/validate-mcp-tool-files.mjs";

export const ruleId = "E-0.1.8.1.1";

export async function run(context = {}) {
  const inventory = context.repositoryInventory;
  if (!inventory?.files || !inventory?.readText)
    return fail(ruleId, "MCP tool files could not be inspected.");
  try {
    const errors = await validateMcpToolFiles(await inventory.files("all"), inventory);
    return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
  } catch (error) {
    return fail(ruleId, `MCP tool files could not be inspected: ${error.message}`);
  }
}
