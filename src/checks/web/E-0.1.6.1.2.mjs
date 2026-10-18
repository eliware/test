import { fail, pass } from "../check-result.mjs";
import { validateBrowserTooling } from "./E-0.1.6.1.2/validate/browser-tooling.mjs";
import { validateWebBuild } from "./E-0.1.6.1.2/validate/web-build.mjs";

export const ruleId = "E-0.1.6.1.2";

export async function run(context = {}) {
  const packageJson = context.packageJson ?? {};
  let configText = "";
  if (typeof context.repositoryInventory?.readText === "function") {
    try {
      configText = await context.repositoryInventory.readText("webpack.config.mjs");
    } catch {
      configText = "";
    }
  }
  const errors = [
    ...validateBrowserTooling(packageJson),
    ...validateWebBuild(packageJson, configText),
  ];
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
