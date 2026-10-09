import { parseAllDocuments } from "yaml";

const workflowDirectory = ".github/workflows/";
const tokenNames = new Set(["NPM_TOKEN", "NODE_AUTH_TOKEN"]);
const npmPublish =
  /\b(?:npm|pnpm|yarn|bun)\s+(?:(?:--?[^\s]+)(?:\s+[^-\s][^\s]*)?\s+)*(?:npm\s+)?publish\b/iu;

export async function validatePrivateWorkflows(inventory) {
  if (!inventory?.files || !inventory?.readText)
    return ["GitHub workflows could not be inspected for npm publication settings."];
  try {
    const paths = (await inventory.files("all")).filter(
      (path) => path.startsWith(workflowDirectory) && /\.ya?ml$/iu.test(path),
    );
    return (await Promise.all(paths.map((path) => validateWorkflow(inventory, path)))).flat();
  } catch (error) {
    return [`GitHub workflows could not be inspected: ${error.message}`];
  }
}

async function validateWorkflow(inventory, path) {
  try {
    const documents = parseAllDocuments(await inventory.readText(path));
    if (documents.length !== 1 || documents[0].errors.length)
      return [`${path} must contain one valid YAML document.`];
    return findViolations(documents[0].toJS(), path);
  } catch (error) {
    return [`${path} could not be inspected: ${error.message}`];
  }
}

function findViolations(value, path) {
  if (Array.isArray(value))
    return value.flatMap((entry, index) => findViolations(entry, `${path}.${index}`));
  if (typeof value === "string")
    return hasTokenReference(value) ? [`${path} must not reference npm publication tokens.`] : [];
  if (!value || typeof value !== "object") return [];
  const errors = [];
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (tokenNames.has(key)) errors.push(`${childPath} must not define npm publication tokens.`);
    if (key === "run" && typeof child === "string" && npmPublish.test(child))
      errors.push(`${childPath} must not run an npm publication command.`);
    errors.push(...findViolations(child, childPath));
  }
  return errors;
}

function hasTokenReference(value) {
  return /(?:^|[\s;,])(?:export\s+|set\s+)?(?:NPM_TOKEN|NODE_AUTH_TOKEN)\s*=|\$\{(?:NPM_TOKEN|NODE_AUTH_TOKEN)\}|\$(?:NPM_TOKEN|NODE_AUTH_TOKEN)\b|\$\{\{\s*secrets\.(?:NPM_TOKEN|NODE_AUTH_TOKEN)\s*\}\}/u.test(
    value,
  );
}
