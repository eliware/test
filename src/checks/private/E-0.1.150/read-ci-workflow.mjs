import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

export async function readCiWorkflow({ root, repositoryInventory }) {
  const path = join(root, ".github", "workflows", "ci.yml");
  const document = repositoryInventory
    ? await repositoryInventory.readParsed(path, "yaml-document", parse)
    : parse(await readFile(path, "utf8"));
  if (!document || typeof document !== "object" || Array.isArray(document))
    throw new Error("CI workflow must contain a YAML mapping.");
  return { name: "ci.yml", document };
}
