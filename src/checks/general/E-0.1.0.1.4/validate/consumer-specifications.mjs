import { readFile } from "node:fs/promises";
import { readConsumerSpecificationFiles } from "./specification/consumer/files.mjs";
import { validateConsumerSpecificationDocuments } from "./specification/consumer/documents.mjs";

export async function validateConsumerSpecifications(
  root,
  namespace,
  { read = readFile, readdir } = {},
) {
  const loaded = await readConsumerSpecificationFiles(root, { read, readdir });
  if (loaded.error) return [loaded.error];
  const errors = [];
  if (typeof namespace !== "string" || !/^E-\d+$/u.test(namespace))
    errors.push("package.json.eliware.id must define the assigned E-number.");
  errors.push(...loaded.errors);
  errors.push(...validateConsumerSpecificationDocuments(loaded.documents, namespace, loaded));
  return errors;
}
