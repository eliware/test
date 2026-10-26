import { join } from "node:path";
import { isJestPolicyFile } from "./policy-file.mjs";

export async function collectJestPolicyFiles(inventory, root) {
  let paths;
  try {
    paths = await inventory.files("all");
  } catch {
    return { errors: ["Jest source policy could not read the repository inventory."], files: [] };
  }
  const files = [];
  const errors = [];
  for (const path of paths) {
    if (!isJestPolicyFile(path)) continue;
    try {
      files.push({ path, content: await inventory.readText(join(root, path)) });
    } catch {
      errors.push(`${path} could not be read to check Jest source policy.`);
    }
  }
  return { errors, files, paths };
}
