import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";
import { findRepositoryFiles } from "./find-repository-files.mjs";

export const ruleId = "E-1.7";
export const parentRuleId = "E-1";

const internalLabel = ["eliware", "internal"].join("-");
const internalPatterns = [
  new RegExp(`(?:^|[^a-z0-9_-])${internalLabel}(?:$|[^a-z0-9_-])`, "i"),
  /\b(?:[a-z0-9-]+\.)*(?:internal|private)\.eliware\.org\b/i,
  /[a-z]:[\\/]+(?:users|home|srv|var[\\/]lib)[\\/]+[^\s"'`,;\])]+/i,
  /\/(?:home|users|srv|var\/lib)\/[^\s"'`,;\])]+/i,
  /(?:^|[^a-z0-9])(?:C:|D:)[\\/]+(?:eliware|Users[\\/]\w+[\\/]src)(?:[\\/]|$)/i,
  /(?:^|[^a-z0-9])file:\/\/(?:internal|private|[^/]+\.internal\.eliware\.org)(?:[\\/]|$)/i,
];
export async function run({ root, files: suppliedFiles }) {
  const findings = [];
  try {
    for (const file of suppliedFiles ?? (await findRepositoryFiles(root))) {
      const content = await readFile(join(root, file), "utf8");
      if (content.includes("\u0000")) continue;
      if (internalPatterns.some((pattern) => pattern.test(content))) findings.push(file);
    }
  } catch (error) {
    return fail(ruleId, `Repository files could not be inspected: ${error.message}`);
  }
  if (findings.length > 0) {
    return fail(
      ruleId,
      `Infrastructure-internal identifiers found in public repository files: ${findings.join(", ")}.`,
    );
  }
  return pass(ruleId);
}
