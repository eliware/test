import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../check-result.mjs";
import { readSpecificationHeadings } from "./E-0.1.0.1.2/read-specification-headings.mjs";
import { validateAgentsStructure } from "./E-0.1.0.1.2/validate-agents-structure.mjs";
import { validateAgentsContent } from "./E-0.1.0.1.2/validate-agents-content.mjs";

export const ruleId = "E-0.1.0.1.2";

export async function run(context = {}, dependencies = {}) {
  const root = context.root ?? process.cwd();
  const read = dependencies.read ?? readFile;
  let content;
  try {
    content = await read(join(root, "AGENTS.md"), "utf8");
  } catch {
    return fail(ruleId, "AGENTS.md is required at the repository root.");
  }
  const errors = validateAgentsContent(content);
  try {
    const headings = await readSpecificationHeadings(root);
    errors.push(...validateAgentsStructure(content, context.packageJson, headings));
  } catch (error) {
    errors.push(`Repository specifications could not be read: ${error.message}`);
  }
  try {
    await (dependencies.access ?? access)(join(root, ".knit", "README.md"));
    errors.push("Do not create README.md inside .knit/.");
  } catch (error) {
    if (error.code !== "ENOENT")
      errors.push(`.knit/README.md could not be checked: ${error.message}`);
  }
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
