import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseEnvironmentAssignments } from "./parse-environment-assignments.mjs";
import { readRepositoryText } from "../../read-repository-text.mjs";

const ownerVariable = "MAIL_OWNER_ADDRESS";

export async function validateMailboxTemplates(root, files, context) {
  for (const file of files) {
    const name = file.split("/").at(-1);
    if (name === ".env" || !(name === ".env.example" || name.startsWith(".env."))) continue;
    let content;
    try {
      content = context
        ? await readRepositoryText(context, join(root, file))
        : await readFile(join(root, file), "utf8");
    } catch (error) {
      return `Environment template could not be inspected: ${error.message}`;
    }
    if (parseEnvironmentAssignments(content).some(([variable]) => variable === ownerVariable)) {
      return `${file} must not define ${ownerVariable}.`;
    }
  }
  return null;
}
