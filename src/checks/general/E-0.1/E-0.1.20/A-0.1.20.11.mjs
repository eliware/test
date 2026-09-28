import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-0.1.20.11";
export const parentRuleId = "E-0.1.20";

export function run({ packageJson }) {
  const capabilities = packageJson?.eliware?.capabilities ?? [];
  if (
    !Array.isArray(capabilities) ||
    capabilities.some((name) => !["typecheck", "build"].includes(name))
  ) {
    return fail(ruleId, "package.json.eliware.capabilities must contain only typecheck and build.");
  }
  const failures = [];
  for (const name of ["typecheck", "build"]) {
    const script = packageJson?.scripts?.[name];
    if (capabilities.includes(name) && (typeof script !== "string" || !script.trim()))
      failures.push(`Declared ${name} capability requires a nonempty npm script.`);
    if (script !== undefined && !capabilities.includes(name))
      failures.push(`package.json.scripts.${name} requires a declared capability entry.`);
  }
  return failures.length > 0 ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
