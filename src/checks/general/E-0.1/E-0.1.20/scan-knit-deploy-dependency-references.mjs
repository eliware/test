import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { collectScriptReferences } from "./collect-script-dependency-references.mjs";

function findCommandLists(value, lists = []) {
  if (Array.isArray(value)) value.forEach((entry) => findCommandLists(entry, lists));
  else if (value && typeof value === "object")
    Object.entries(value).forEach(([key, entry]) => {
      if (key === "commands") lists.push(entry);
      else findCommandLists(entry, lists);
    });
  return lists;
}

export async function scanKnitDeployDependencyReferences(
  root,
  files,
  declared,
  referenced,
  dependencyBinaries,
  inventory = null,
) {
  if (!files.includes(".knit/deploy.yaml")) return;
  try {
    const path = join(root, ".knit", "deploy.yaml");
    const deployment = inventory
      ? await inventory.readParsed(path, "yaml-document", parse)
      : parse(await readFile(path, "utf8"));
    for (const commands of findCommandLists(deployment))
      if (Array.isArray(commands))
        for (const command of commands)
          collectScriptReferences({ deploy: command }, declared, referenced, dependencyBinaries);
  } catch {
    // Knit configuration syntax is reported by its owning convention check.
  }
}
