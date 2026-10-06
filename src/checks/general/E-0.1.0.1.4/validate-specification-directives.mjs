import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { parseAllDocuments } from "yaml";
import { validateSpecificationDocument } from "./validate-specification-document.mjs";
import { validateSpecificationIds } from "./validate-specification-ids.mjs";
import { validateV12DirectiveSchema } from "./validate-v12-directive-schema.mjs";

export async function validateSpecificationDirectives(root, packageJson = {}, dependencies = {}) {
  const read = dependencies.read ?? readFile;
  let schema;
  let harness;
  try {
    schema = parseDocuments(await read(join(root, "specs", "directives-schema.yaml"), "utf8"));
    harness = parseDocuments(await read(join(root, "specs", "directives.yaml"), "utf8"));
  } catch (error) {
    return [`Directive schema or document is missing or invalid: ${error.message}`];
  }
  const errors = [];
  errors.push(...schema.flatMap((document) => validateV12DirectiveSchema(document)));
  const expectedNamespace = packageJson?.eliware?.id;
  if (typeof expectedNamespace !== "string" || !/^E-\d+$/u.test(expectedNamespace))
    errors.push("package.json.eliware.id must define the assigned E-number.");
  const documents = harness.map((value, index) => ({
    path: `specs/directives.yaml document ${index + 1}`,
    value,
  }));
  try {
    for (const path of await yamlFiles(join(root, "specs", "conventions"))) {
      const values = parseDocuments(await read(join(root, "specs", "conventions", path), "utf8"));
      values.forEach((value, index) =>
        documents.push({ path: `specs/conventions/${path} document ${index + 1}`, value }),
      );
    }
  } catch (error) {
    errors.push(`Specification YAML could not be read: ${error.message}`);
  }
  const idDocuments = new Map();
  for (const { path, value } of documents) {
    errors.push(...validateSpecificationDocument(value, path));
    errors.push(...validateProfileRequirements(value, path, documents));
    const sourcePath = path.replace(/ document \d+$/u, "");
    const entry = idDocuments.get(sourcePath) ?? [];
    if (Array.isArray(value?.directives)) entry.push(...value.directives);
    idDocuments.set(sourcePath, entry);
  }
  const allIds = [...idDocuments].map(([path, directives]) => ({ path, directives }));
  errors.push(...validateSpecificationIds(allIds, expectedNamespace));
  return errors;
}

function validateProfileRequirements(value, path, documents) {
  if (!path.startsWith("specs/conventions/")) return [];
  const profile = /\/([^/]+)-(?:semantic|deterministic)\.ya?ml(?: document \d+)?$/u.exec(path)?.[1];
  if (!profile) return [];
  const required = value?.requires;
  if (!Array.isArray(required)) return [];
  const profiles = new Set(
    documents
      .map(
        ({ path: candidate }) =>
          /\/([^/]+)-(?:semantic|deterministic)\.ya?ml(?: document \d+)?$/u.exec(candidate)?.[1],
      )
      .filter(Boolean),
  );
  const errors = [];
  if (new Set(required).size !== required.length)
    errors.push(`${path}.requires must not contain duplicate profiles.`);
  if (required.includes(profile)) errors.push(`${path}.requires must not include its own profile.`);
  const unknown = required.filter((name) => !profiles.has(name));
  if (unknown.length)
    errors.push(`${path}.requires names unknown profiles: ${unknown.join(", ")}.`);
  return errors;
}

function parseDocuments(source) {
  const documents = parseAllDocuments(source);
  const errors = documents.flatMap((document) => document.errors);
  if (errors.length) throw new Error(errors.map(({ message }) => message).join("; "));
  return documents.map((document) => document.toJSON());
}

async function yamlFiles(directory, root = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await yamlFiles(path, root)));
    else if (entry.isFile() && /\.ya?ml$/iu.test(entry.name))
      files.push(relative(root, path).split(sep).join("/"));
  }
  return files;
}
