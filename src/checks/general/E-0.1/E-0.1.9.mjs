import { fail, pass } from "../../check-result.mjs";
import { validatePackageProfileSelection } from "./validate-package-profile-selection.mjs";

export const ruleId = "E-0.1.9";
export const parentRuleId = "E-0.1";

export function run({ packageJson }) {
  const metadata = packageJson?.eliware;
  if (!metadata || typeof metadata !== "object") {
    return fail(ruleId, "package.json must contain an eliware metadata object.");
  }
  const failures = ["id", "apply"]
    .filter((field) => !(field in metadata))
    .map((field) => `package.json.eliware.${field} is required.`);
  if ("id" in metadata && (typeof metadata.id !== "string" || !metadata.id.trim()))
    failures.push("package.json.eliware.id must be a non-empty string.");
  const allowedKeys = ["id", "apply", "exempt"];
  const keys = Object.keys(metadata);
  const unexpectedKeys = keys.filter((key) => !allowedKeys.includes(key));
  if (unexpectedKeys.length)
    failures.push(
      `package.json.eliware contains unsupported keys: ${unexpectedKeys.sort().join(", ")}.`,
    );
  const expectedKeys = ["id", "apply", ...(Object.hasOwn(metadata, "exempt") ? ["exempt"] : [])];
  if (!unexpectedKeys.length && keys.join(",") !== expectedKeys.join(","))
    failures.push("package.json.eliware keys must be ordered id, apply, then optional exempt.");
  const profileError = validatePackageProfileSelection(packageJson);
  if (profileError) failures.push(profileError);
  if (failures.length) return fail(ruleId, failures.join("\n"));
  return pass(ruleId);
}
