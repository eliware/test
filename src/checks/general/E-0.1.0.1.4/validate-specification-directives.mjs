import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseAllDocuments } from "yaml";
import { listSpecificationEntries } from "./list-specification-entries.mjs";
import { validateSpecificationDocument } from "./validate-specification-document.mjs";
import { validateSpecificationIds } from "./validate-specification-ids.mjs";
import { validateV12DirectiveSchema } from "./validate-v12-directive-schema.mjs";

export async function validateSpecificationDirectives(root, packageJson = {}, dependencies = {}) {
  const read = dependencies.read ?? readFile;
  const list = dependencies.readdir;
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
    const entries = await listSpecificationEntries(root, { list });
    if (!entries.some(({ path, type }) => path === "specs/conventions" && type === "directory"))
      throw new Error("specs/conventions is missing.");
    for (const { path } of entries.filter(
      ({ path, type }) => type === "file" && /^specs\/conventions\/.*\.ya?ml$/iu.test(path),
    )) {
      const values = parseDocuments(await read(join(root, path), "utf8"));
      values.forEach((value, index) =>
        documents.push({ path: `${path} document ${index + 1}`, value }),
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
  const profileDocuments = documents.flatMap(({ path: candidate, value: document }) => {
    const match = /\/([^/]+)-(?:semantic|deterministic)\.ya?ml(?: document \d+)?$/u.exec(candidate);
    return match ? [{ profile: match[1], document, path: candidate }] : [];
  });
  const profiles = new Set(profileDocuments.map(({ profile: name }) => name));
  const errors = [];
  for (const field of ["requires", "conflicts"]) {
    const names = value?.[field];
    if (!Array.isArray(names)) {
      errors.push(`${path}.${field} must list valid profile names.`);
      continue;
    }
    if (new Set(names).size !== names.length)
      errors.push(`${path}.${field} must not contain duplicate profiles.`);
    if (names.includes(profile)) errors.push(`${path}.${field} must not include its own profile.`);
    const unknown = names.filter((name) => !profiles.has(name));
    if (unknown.length)
      errors.push(`${path}.${field} names unknown profiles: ${unknown.join(", ")}.`);
    if (field === "conflicts") {
      for (const name of names.filter((candidate) => profiles.has(candidate))) {
        const targetDocuments = profileDocuments.filter(({ profile: target }) => target === name);
        if (targetDocuments.some(({ document: target }) => !target?.conflicts?.includes(profile)))
          errors.push(`${path}.conflicts must be declared by ${name}.`);
      }
    }
  }
  return errors;
}

function parseDocuments(source) {
  const documents = parseAllDocuments(source);
  const errors = documents.flatMap((document) => document.errors);
  if (errors.length) throw new Error(errors.map(({ message }) => message).join("; "));
  return documents.map((document) => document.toJSON());
}
