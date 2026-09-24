import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.140.0";
export const parentRuleId = "E-1.140";

export async function run({ root, packageJson }) {
  try {
    const agents = await readFile(join(root, "AGENTS.md"), "utf8");
    const section =
      agents
        .split(/^## npm publication\s*$/imu)[1]
        ?.split(/^##\s+/mu)[0]
        ?.toLowerCase() ?? "";
    const requirements = [
      { label: "package identity", terms: [packageJson?.name ?? "package"] },
      { label: "version source", terms: ["package.json", "version"] },
      {
        label: "files allowlist",
        terms: ["allowlist", ...(Array.isArray(packageJson?.files) ? packageJson.files : [])],
      },
      {
        label: "pack validation command",
        terms: [packageJson?.scripts?.pack ?? "eliware-test --pack"],
      },
      { label: "pack validation result", terms: ["pass", "succeed"], mode: "any" },
      { label: "npm provenance mechanism", terms: ["provenance", "npm"] },
      { label: "exact-version registry verification", terms: ["exact", "version", "registry"] },
      { label: "release authorization and handoff", terms: ["authorization", "handoff"] },
    ];
    const missing = requirements
      .filter(({ terms, mode }) => {
        const contains = (term) =>
          section.includes(String(term).replaceAll("\\", "/").toLowerCase());
        return mode === "any" ? !terms.some(contains) : terms.some((term) => !contains(term));
      })
      .map(({ label }) => label);
    if (missing.length > 0)
      return fail(
        ruleId,
        `AGENTS.md npm publication section is missing required guidance: ${missing.join(", ")}.`,
      );
  } catch {
    return fail(ruleId, "AGENTS.md must document npm publication requirements.");
  }
  return pass(ruleId);
}
