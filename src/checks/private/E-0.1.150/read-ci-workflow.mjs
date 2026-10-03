import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseSingleYamlDocument } from "../../general/E-0.1/parse-single-yaml-document.mjs";

export async function readCiWorkflow({ root, repositoryInventory }) {
  const path = join(root, ".github", "workflows", "ci.yaml");
  const document = repositoryInventory
    ? await repositoryInventory.readParsed(path, "yaml-document", parseSingleYamlDocument)
    : parseSingleYamlDocument(await readFile(path, "utf8"));
  if (!document || typeof document !== "object" || Array.isArray(document))
    throw new Error("CI workflow must contain a YAML mapping.");
  return { name: "ci.yaml", document };
}
