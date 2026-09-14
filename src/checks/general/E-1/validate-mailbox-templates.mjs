import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseEnvironmentAssignments } from "./parse-environment-assignments.mjs";

const ownerVariable = "MAIL_OWNER_ADDRESS";

export async function validateMailboxTemplates(root, files) {
  for (const file of files) {
    const name = file.split("/").at(-1);
    if (name === ".env" || !(name === ".env.example" || name.startsWith(".env."))) continue;
    let content;
    try {
      content = await readFile(join(root, file), "utf8");
    } catch (error) {
      return `Environment template could not be inspected: ${error.message}`;
    }
    if (parseEnvironmentAssignments(content).some(([variable]) => variable === ownerVariable)) {
      return `${file} must not define ${ownerVariable}.`;
    }
  }
  return null;
}
