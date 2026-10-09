import { fail, pass } from "../check-result.mjs";
import { validateGhcrAttestationChain } from "./E-0.1.11.1.2/validate-ghcr-attestation-chain.mjs";

export const ruleId = "E-0.1.11.1.2";

export async function run(context = {}) {
  const errors = await validateGhcrAttestationChain(
    context.repositoryInventory,
    context.packageJson,
  );
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
