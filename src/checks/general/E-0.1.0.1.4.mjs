import { fail, pass } from "../../orchestration/check-result.mjs";
import { validateMarkdownLinks } from "./E-0.1.0.1.4/validate-markdown-links.mjs";
import { validateSpecificationIndexes } from "./E-0.1.0.1.4/validate-specification-indexes.mjs";
import { validateSpecificationDirectives } from "./E-0.1.0.1.4/validate-specification-directives.mjs";

export const ruleId = "E-0.1.0.1.4";

export async function run(context = {}, dependencies = {}) {
  const root = context.root ?? process.cwd();
  const errors = [];
  errors.push(...(await validateMarkdownLinks(root, context, dependencies)));
  errors.push(...(await validateSpecificationIndexes(root, dependencies)));
  errors.push(...(await validateSpecificationDirectives(root, context.packageJson, dependencies)));
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
