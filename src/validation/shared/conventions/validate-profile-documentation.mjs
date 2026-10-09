import { removeMarkdownCode } from "../../../checks/general/E-0.1.0.1.4/extract-markdown-links.mjs";
import { readCanonicalOrder } from "./read-canonical-order.mjs";

export async function validateProfileDocumentation(
  profile,
  inventory,
  readOrder = readCanonicalOrder,
) {
  if (!inventory?.readText) return ["Repository documents could not be inspected."];
  const agentsOrder = readOrder("agents-sections.yaml");
  const readmeOrder = readOrder("readme-sections.yaml");
  const errors = [];
  const agentsError = await validateHeading(
    inventory,
    "AGENTS.md",
    agentsOrder.profileHeadings[profile],
  );
  if (agentsError) errors.push(agentsError);
  const sections = readmeOrder.profileSections[profile] ?? [];
  if (sections.length) {
    errors.push(...(await validateHeadings(inventory, "README.md", sections)));
  }
  return errors;
}

async function validateHeading(inventory, path, heading) {
  const errors = await validateHeadings(inventory, path, [heading]);
  return errors[0] ?? null;
}

async function validateHeadings(inventory, path, headings) {
  let content;
  try {
    content = removeMarkdownCode(await inventory.readText(path));
  } catch (error) {
    return [`${path} could not be read: ${error.message}`];
  }
  const actual = new Set(
    content
      .split(/\r?\n/u)
      .filter((line) => /^##\s+/u.test(line))
      .map((line) => line.slice(3).trim()),
  );
  const missing = headings.filter((heading) => !actual.has(heading));
  return missing.map((heading) => `${path} must include: ## ${heading}`);
}
