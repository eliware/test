import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { listSpecificationEntries } from "../list-specification-entries.mjs";
import { validateBundledConventionDocuments } from "./bundled/convention-documents.mjs";
import { validateBundledDirectiveSchema } from "./bundled/directive-schema.mjs";
import { parseBundledYamlDocuments } from "./specification/parse-bundled-yaml-documents.mjs";

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
    schema = parseBundledYamlDocuments(
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
    const values = parseBundledYamlDocuments(await read(join(root, path), "utf8"), path);
    values.forEach((value, index) =>
      documents.push({ path: `${path} document ${index + 1}`, value }),
    );
  }
  return documents;
}
