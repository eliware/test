import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-0.1.50.5";
export const parentRuleId = "E-0.1.50";

export function run({ packageJson }) {
  const dependencies = packageJson?.dependencies ?? {};
  const failures = [];
  for (const name of ["lighthouse", "puppeteer"]) {
    if (!dependencies[name]) failures.push(`Web applications must directly declare ${name}.`);
    if (typeof packageJson?.scripts?.[name] !== "string" || !packageJson.scripts[name].trim())
      failures.push(`Web applications must define a ${name} script.`);
    if (typeof packageJson?.scripts?.[name] !== "string" || !packageJson.scripts[name].trim())
      continue;
    const command = packageJson.scripts[name].trim().split(/\s+/u)[0].split(/[\\/]/u).pop();
    if (command !== name)
      failures.push(
        `Web applications' ${name} script must invoke the local ${name} command directly.`,
      );
  }
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
