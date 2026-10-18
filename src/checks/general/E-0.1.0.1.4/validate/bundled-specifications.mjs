import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { parseBoundedYamlDocuments } from "../../../../validation/shared/yaml/parse-bounded-yaml-documents.mjs";
import { listSpecificationEntries } from "../list-specification-entries.mjs";
import { validateBundledConventionDocuments } from "./bundled/convention-documents.mjs";
import { validateBundledDirectiveSchema } from "./bundled/directive-schema.mjs";

const suiteRoot = fileURLToPath(new URL("../../../../../", import.meta.url));

export async function validateBundledSpecifications({
  root = suiteRoot,
  packageJson,
  entries,
  read = readFile,
  readdir,
} = {}) {
  let schema;
  let documents;
  try {
    schema = parseDocuments(
      await read(join(root, "specs/directives-schema.yaml"), "utf8"),
      "specs/directives-schema.yaml",
    );
    const discoveredEntries = entries ?? (await listSpecificationEntries(root, { list: readdir }));
    documents = await readConventionDocuments(root, discoveredEntries, read);
    packageJson ??= JSON.parse(await read(join(root, "package.json"), "utf8"));
  } catch (error) {
    return [`Bundled specifications are missing or invalid: ${error.message}`];
  }
  return [
    ...validateBundledDirectiveSchema(schema),
    ...validateBundledConventionDocuments(documents, packageJson?.eliware?.id),
  ];
}

async function readConventionDocuments(root, entries, read) {
  const paths = entries
    .filter(
      ({ path, type }) =>
        type === "file" &&
        /^specs\/conventions\/.*\.ya?ml$/iu.test(path) &&
        path !== "specs/conventions/ordering/profile-combinations.yaml",
    )
    .map(({ path }) => path);
  const documents = [];
  for (const path of paths) {
    const values = parseDocuments(await read(join(root, path), "utf8"), path);
    values.forEach((value, index) =>
      documents.push({ path: `${path} document ${index + 1}`, value }),
    );
  }
  return documents;
}

function parseDocuments(source, path) {
  const parsed = parseBoundedYamlDocuments(source, path);
  const errors = parsed.flatMap((document) => document.errors);
  if (errors.length) throw new Error(errors.map(({ message }) => message).join(". "));
  return parsed.map((document) => document.toJSON());
}
