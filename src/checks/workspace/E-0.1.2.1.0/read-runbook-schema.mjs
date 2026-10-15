import { readFile } from "node:fs/promises";
import { parseBoundedYamlDocuments } from "../../../validation/shared/yaml/parse-bounded-yaml-documents.mjs";

const schemaUrl = new URL("../../../../specs/runbook-schema.yaml", import.meta.url);

export async function readRunbookSchema(read = readFile) {
  const documents = parseBoundedYamlDocuments(await read(schemaUrl, "utf8"), schemaUrl.pathname);
  const parseError = documents.flatMap((document) => document.errors)[0];
  if (parseError) throw new Error(parseError.message);
  if (documents.length !== 1) throw new Error("The schema must contain one YAML document.");
  return documents[0].toJS();
}
