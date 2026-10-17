import { parseBoundedYamlDocuments } from "../../../../validation/shared/yaml/parse-bounded-yaml-documents.mjs";
import { validateRunbookSchemaValue } from "./schema-value.mjs";

export function validateRunbookDocument(content, path, schema) {
  let documents;
  try {
    documents = parseBoundedYamlDocuments(content, path);
  } catch (error) {
    return [`${path} is invalid YAML: ${error.message}`];
  }
  const parseError = documents.flatMap((document) => document.errors)[0];
  if (parseError) return [`${path} is invalid YAML: ${parseError.message}`];
  if (documents.length !== 1) return [`${path} must contain one YAML document.`];
  try {
    return validateRunbookSchemaValue(documents[0].toJS(), schema, path);
  } catch (error) {
    return [`${path} could not be validated: ${error.message}`];
  }
}
