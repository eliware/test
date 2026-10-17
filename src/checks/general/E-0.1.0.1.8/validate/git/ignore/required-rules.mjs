import { readFile } from "node:fs/promises";
import { validateRequiredIgnoreRules } from "../../ignore-patterns.mjs";

export async function validateGitIgnoreRequiredRules(root, readText = readFile) {
  try {
    return validateRequiredIgnoreRules(await readText(`${root}/.gitignore`, "utf8"));
  } catch {
    return [".gitignore could not be read to check required ignore rules."];
  }
}
