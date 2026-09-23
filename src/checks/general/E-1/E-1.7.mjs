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

function containsBinaryControlCharacters(content) {
  for (const character of content) {
    const codePoint = character.codePointAt(0);
    if (
      (codePoint < 0x20 && ![0x09, 0x0a, 0x0d].includes(codePoint)) ||
      (codePoint >= 0x7f && codePoint <= 0x9f)
    ) {
      return true;
    }
  }
  return false;
}

export async function run({ root, files: suppliedFiles }) {
  const findings = [];
  try {
    for (const file of suppliedFiles ?? (await findRepositoryFiles(root))) {
      const bytes = await readFile(join(root, file));
      let content;
      try {
        content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        continue;
      }
      if (containsBinaryControlCharacters(content)) continue;
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
