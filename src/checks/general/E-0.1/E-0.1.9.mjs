import { fail, pass } from "../../check-result.mjs";
import { validatePackageProfileSelection } from "./validate-package-profile-selection.mjs";

export const ruleId = "E-0.1.9";
export const parentRuleId = "E-0.1";

export function run({ packageJson }) {
  const metadata = packageJson?.eliware;
  if (!metadata || typeof metadata !== "object") {
    return fail(ruleId, "package.json must contain an eliware metadata object.");
  }
  const failures = ["apply"]
    .filter((field) => !(field in metadata))
    .map((field) => `package.json.eliware.${field} is required.`);
  const unexpectedKeys = Object.keys(metadata).filter((key) => !["apply", "exempt"].includes(key));
  if (unexpectedKeys.length)
    failures.push(
      `package.json.eliware contains unsupported keys: ${unexpectedKeys.sort().join(", ")}.`,
    );
  const profileError = validatePackageProfileSelection(packageJson);
  if (profileError) failures.push(profileError);
  if (failures.length) return fail(ruleId, failures.join("\n"));
  return pass(ruleId);
}
