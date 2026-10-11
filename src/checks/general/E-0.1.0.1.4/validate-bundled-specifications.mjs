import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { parseAllDocuments } from "yaml";
import { listSpecificationEntries } from "./list-specification-entries.mjs";
import { validateProfileRequirements } from "./validate-profile-requirements.mjs";
import { validateSpecificationDocument } from "./validate-specification-document.mjs";
import { validateSpecificationIds } from "./validate-specification-ids.mjs";
import { validateV12DirectiveSchema } from "./validate-v12-directive-schema.mjs";

const schemaUrl = new URL("../../../../specs/directives-schema.yaml", import.meta.url);
const suiteRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const suitePackage = JSON.parse(readFileSync(new URL("../../../../package.json", import.meta.url)));

export async function validateBundledSpecifications({ read = readFile, readdir } = {}) {
  let schema;
  let documents;
  try {
    schema = parseDocuments(await read(schemaUrl, "utf8"));
    const entries = await listSpecificationEntries(suiteRoot, { list: readdir });
    documents = await readConventionDocuments(entries, read);
  } catch (error) {
    return [`Bundled specifications are missing or invalid: ${error.message}`];
  }
  const errors = schema.flatMap((document) => validateV12DirectiveSchema(document));
  const ids = new Map();
  for (const { path, value } of documents) {
    errors.push(...validateSpecificationDocument(value, path));
    errors.push(...validateProfileRequirements(value, path, documents));
    const sourcePath = path.replace(/ document \d+$/u, "");
    const directives = ids.get(sourcePath) ?? [];
    if (Array.isArray(value?.directives)) directives.push(...value.directives);
    ids.set(sourcePath, directives);
  }
  errors.push(
    ...validateSpecificationIds(
      [...ids].map(([path, directives]) => ({ path, directives })),
      suitePackage?.eliware?.id,
    ),
  );
  return errors;
}

async function readConventionDocuments(entries, read) {
  const paths = entries
    .filter(({ path, type }) => type === "file" && /^specs\/conventions\/.*\.ya?ml$/iu.test(path))
    .map(({ path }) => path);
  const documents = [];
  for (const path of paths) {
    const values = parseDocuments(await read(join(suiteRoot, path), "utf8"));
    values.forEach((value, index) =>
      documents.push({ path: `${path} document ${index + 1}`, value }),
    );
  }
  return documents;
}

function parseDocuments(source) {
  const parsed = parseAllDocuments(source);
  const errors = parsed.flatMap((document) => document.errors);
  if (errors.length) throw new Error(errors.map(({ message }) => message).join("; "));
  return parsed.map((document) => document.toJSON());
}
