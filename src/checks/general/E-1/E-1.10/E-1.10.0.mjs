import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { commandTokens, parseKnitScript } from "./parse-knit-script.mjs";

export const ruleId = "E-1.10.0";
export const parentRuleId = "E-1.10";
const allowedCommands = new Set(["node", "npm", "npx", "git", "echo"]);

export async function run({ root }) {
  try {
    const source = await readFile(join(root, ".knit", "validate.mjs"), "utf8");
    const parsed = parseKnitScript(source);
    if (parsed.error) return fail(ruleId, parsed.error);
    if (parsed.unsupported?.length > 0) {
      return fail(
        ruleId,
        ".knit/validate.mjs contains an unsupported dynamic or state-mutating operation.",
      );
    }
    if (parsed.calls.some((call) => !commandTokens(call))) {
      return fail(
        ruleId,
        ".knit/validate.mjs must use statically inspectable child-process commands.",
      );
    }
    if (parsed.calls.some((call) => !allowedCommands.has(commandTokens(call)[0].replace(/^.*[\\/]/u, "").toLowerCase()))) {
      return fail(ruleId, ".knit/validate.mjs uses a command outside the read-only validation allowlist.");
    }
    if (
      /(?:node:)?(?:fs|fs\/promises)\.(?:rm|rmdir|unlink|rename|writeFile|chmod)|\b(?:fetch|https?\.request|net\.connect|process\.exit)\s*\(/iu.test(
        source,
      )
    ) {
      return fail(ruleId, ".knit/validate.mjs contains an unsupported filesystem, network, process, or subprocess operation.");
    }
    const prohibited =
      /^(?:npm\s+(?:publish|login|adduser)|docker\s+(?:push|login)|kubectl\s+(?:apply|delete|patch|replace)|git\s+(?:tag|push|reset|clean)|(?:sudo\s+)?(?:reboot|shutdown|systemctl\s+(?:start|stop|restart))|rm\s+-rf)\b/i;
    if (parsed.calls.some((call) => prohibited.test(commandTokens(call).join(" ")))) {
      return fail(
        ruleId,
        ".knit/validate.mjs must not publish, deploy, release, or mutate external state.",
      );
    }
  } catch {
    return fail(ruleId, ".knit/validate.mjs is required for Knit validation.");
  }
  return pass(ruleId);
}
