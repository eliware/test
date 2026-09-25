import { fail, pass } from "../../../check-result.mjs";
import { findPureBarrels } from "./find-pure-barrels.mjs";
import { publicEntrypoints } from "./public-entrypoints.mjs";

export async function runPureExportBarrelPolicy({ root, packageJson, ruleId }) {
  let barrels;
  try {
    barrels = await findPureBarrels(root);
  } catch (error) {
    return fail(ruleId, `Source modules could not be classified for pure export barrels: ${error.message}`);
  }
  if (barrels.length === 0) return pass(ruleId);
  const isLibrary = packageJson?.eliware?.apply?.includes("library");
  const allowed = publicEntrypoints(packageJson);
  const internal = barrels.filter((file) => !isLibrary || !allowed.has(file));
  return internal.length === 0
    ? pass(ruleId)
    : fail(ruleId, `Internal pure export barrels are not allowed: ${internal.join(", ")}.`);
}
