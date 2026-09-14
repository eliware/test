import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.50.5";
export const parentRuleId = "E-1.50";

export function run({ packageJson }) {
  const dependencies = packageJson?.dependencies ?? {};
  for (const name of ["lighthouse", "puppeteer"]) {
    if (!dependencies[name]) return fail(ruleId, `Web applications must directly declare ${name}.`);
    if (typeof packageJson?.scripts?.[name] !== "string" || !packageJson.scripts[name].trim())
      return fail(ruleId, `Web applications must define a ${name} script.`);
    const command = packageJson.scripts[name].trim().split(/\s+/u)[0].split(/[\\/]/u).pop();
    if (command !== name)
      return fail(ruleId, `Web applications' ${name} script must invoke the local ${name} command directly.`);
  }
  return pass(ruleId);
}
