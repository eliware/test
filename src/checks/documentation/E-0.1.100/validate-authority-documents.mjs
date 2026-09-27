import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { classifyAuthorityDocument } from "./classify-authority-document.mjs";
import { validateAuthorityRecord } from "./validate-authority-record.mjs";
import { validateAuthorityMap } from "./validate-authority-map.mjs";

export async function validateAuthorityDocuments(root, files, inventory) {
  for (const relativeFile of files.filter((file) => file.endsWith(".json"))) {
    const file = join(root, relativeFile);
    const document = inventory
      ? await inventory.readParsed(file, "json", JSON.parse)
      : JSON.parse(await readFile(file, "utf8"));
    const kind = classifyAuthorityDocument(relativeFile, document);
    const result = kind === "map"
      ? await validateAuthorityMap({ root, file, document, inventory })
      : kind === "record"
        ? await validateAuthorityRecord({ root, file, document })
        : null;
    if (result) return result;
  }
  return null;
}
