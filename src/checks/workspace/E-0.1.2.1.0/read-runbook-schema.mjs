import { readFile } from "node:fs/promises";
import { parseAllDocuments } from "yaml";

const schemaUrl = new URL("../../../../specs/runbook-schema.yaml", import.meta.url);

export async function readRunbookSchema(read = readFile) {
  const documents = parseAllDocuments(await read(schemaUrl, "utf8"));
  const parseError = documents.flatMap((document) => document.errors)[0];
  if (parseError) throw new Error(parseError.message);
  if (documents.length !== 1) throw new Error("The schema must contain one YAML document.");
  return documents[0].toJS();
}
