import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { validateAuthorityRecord } from "./validate-authority-record.mjs";
import { validateAuthorityMap } from "./validate-authority-map.mjs";

export async function validateAuthorityDocuments(root, files) {
  for (const relativeFile of files.filter((file) => file.endsWith(".json"))) {
    const file = join(root, relativeFile);
    const document = JSON.parse(await readFile(file, "utf8"));
    const result = basename(relativeFile) === "authority-map.json"
      ? await validateAuthorityMap({ root, file, document })
      : relativeFile.replaceAll("\\", "/").endsWith("specs/authority.json")
        ? await validateAuthorityRecord({ root, file, document })
        : null;
    if (result) return result;
  }
  return null;
}
