import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { validateBundledConventionDocuments } from "./bundled/convention/documents.mjs";
import { loadBundledConventionDocuments } from "./bundled/convention/loader.mjs";
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
    documents = await loadBundledConventionDocuments({ root, entries, read, readdir });
    packageJson ??= JSON.parse(await read(join(root, "package.json"), "utf8"));
  } catch (error) {
    return [`Bundled specifications are missing or invalid: ${error.message}`];
  }
  return [
    ...validateBundledDirectiveSchema(schema),
    ...validateBundledConventionDocuments(documents, packageJson?.eliware?.id),
  ];
}
