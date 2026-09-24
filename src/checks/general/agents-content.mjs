import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../check-result.mjs";

export async function checkAgents(root, ruleId, groups, { section } = {}) {
  let content;
  try {
    content = (await readFile(join(root, "AGENTS.md"), "utf8")).toLowerCase();
  } catch {
    return fail(ruleId, "AGENTS.md is required.");
  }
  const sectionContent = section ? readSection(content, section) : content;
  const missing = groups
    .filter((group) => !group.some((term) => sectionContent.includes(term)))
    .map((group) => group[0]);
  return missing.length
    ? fail(ruleId, `AGENTS.md is missing required guidance: ${missing.join(", ")}.`)
    : pass(ruleId);
}

function readSection(content, heading) {
  const lines = content.split(/\r?\n/u);
  const start = lines.findIndex(
    (line) => line.trim().toLowerCase() === `## ${heading}`.toLowerCase(),
  );
  if (start < 0) return "";
  const end = lines.findIndex((line, index) => index > start && /^#{1,6}\s+\S/u.test(line));
  return lines.slice(start + 1, end < 0 ? lines.length : end).join("\n");
}
