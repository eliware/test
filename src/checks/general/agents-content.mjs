import { readRepositoryParsed } from "../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../check-result.mjs";

export async function checkAgents(root, ruleId, groups, { context, section } = {}) {
  const agentsPath = join(root, "AGENTS.md");
  let content;
  try {
    content = await readRepositoryParsed(context, agentsPath, "agents:lowercase", (text) =>
      text.toLowerCase(),
    );
  } catch {
    return fail(ruleId, "AGENTS.md is required.");
  }
  const sectionContent = section
    ? await readRepositoryParsed(
        context,
        agentsPath,
        `agents:section:${section.toLowerCase()}`,
        () => readSection(content, section),
      )
    : content;
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
