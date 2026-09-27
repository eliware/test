import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-0.1.20.11";
export const parentRuleId = "E-0.1.20";

export function run({ packageJson }) {
  const capabilities = packageJson?.eliware?.capabilities ?? [];
  if (!Array.isArray(capabilities) || capabilities.some((name) => !["typecheck", "build"].includes(name))) {
    return fail(ruleId, "package.json.eliware.capabilities must contain only typecheck and build.");
  }
  for (const name of ["typecheck", "build"]) {
    const script = packageJson?.scripts?.[name];
    if (capabilities.includes(name) && (typeof script !== "string" || !script.trim()))
      return fail(ruleId, `Declared ${name} capability requires a nonempty npm script.`);
    if (script !== undefined && !capabilities.includes(name))
      return fail(ruleId, `package.json.scripts.${name} requires a declared package.json.eliware.capabilities entry.`);
  }
  return pass(ruleId);
}
