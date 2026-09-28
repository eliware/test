import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { classifyAuthorityDocument } from "./classify-authority-document.mjs";
import { validateAuthorityRecord } from "./validate-authority-record.mjs";
import { validateAuthorityMap } from "./validate-authority-map.mjs";
import { readRegisteredRepositoryRoots } from "./read-registered-repository-roots.mjs";

export async function validateAuthorityDocuments(root, files, inventory) {
  const failures = [];
  const documents = [];
  for (const relativeFile of files.filter((file) => file.endsWith(".json"))) {
    const file = join(root, relativeFile);
    let document;
    try {
      document = inventory
        ? await inventory.readParsed(file, "json", JSON.parse)
        : JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      failures.push(`${relativeFile}: ${error.message}`);
      continue;
    }
    documents.push({
      relativeFile,
      file,
      document,
      kind: classifyAuthorityDocument(relativeFile, document),
    });
  }
  const registeredRepositoryRoots = documents.some(({ kind }) => kind === "record")
    ? ((await readRegisteredRepositoryRoots(root, inventory)) ?? [])
    : [];
  for (const { relativeFile, file, document, kind } of documents) {
    const result =
      kind === "map"
        ? await validateAuthorityMap({ root, file, document, inventory })
        : kind === "record"
          ? await validateAuthorityRecord({
              root,
              file,
              document,
              registeredRepositoryRoots,
            })
          : null;
    if (result) failures.push(`${relativeFile}: ${result}`);
  }
  return failures.length ? failures.join("\n") : null;
}
