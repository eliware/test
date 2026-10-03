import { parseAllDocuments } from "yaml";

export function parseSingleYamlDocument(source) {
  const documents = parseAllDocuments(source);
  const error = documents.flatMap((document) => document.errors)[0];
  if (error) throw error;
  if (documents.length !== 1)
    throw new Error(`Expected exactly one YAML document; found ${documents.length}.`);
  return documents[0].toJS();
}
