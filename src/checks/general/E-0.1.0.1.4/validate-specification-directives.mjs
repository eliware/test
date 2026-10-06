import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { parse } from "yaml";
import { validateSpecificationDocument } from "./validate-specification-document.mjs";
import { validateSpecificationIds } from "./validate-specification-ids.mjs";
import { validateV12DirectiveSchema } from "./validate-v12-directive-schema.mjs";

export async function validateSpecificationDirectives(root, packageJson = {}, dependencies = {}) {
  const read = dependencies.read ?? readFile;
  let schema;
  let harness;
  try {
    schema = parse(await read(join(root, "specs", "directives-schema.yaml"), "utf8"));
    harness = parse(await read(join(root, "specs", "directives.yaml"), "utf8"));
  } catch (error) {
    return [`Directive schema or document is missing or invalid: ${error.message}`];
  }
  const errors = [];
  errors.push(...validateV12DirectiveSchema(schema));
  const expectedNamespace = packageJson?.eliware?.id;
  if (typeof expectedNamespace !== "string" || !/^E-\d+$/u.test(expectedNamespace))
    errors.push("package.json.eliware.id must define the assigned E-number.");
  const documents = [{ path: "specs/directives.yaml", value: harness }];
  try {
    for (const path of await yamlFiles(join(root, "specs", "conventions"))) {
      documents.push({
        path: `specs/conventions/${path}`,
        value: parse(await read(join(root, "specs", "conventions", path), "utf8")),
      });
    }
  } catch (error) {
    errors.push(`Specification YAML could not be read: ${error.message}`);
  }
  const allIds = [];
  for (const { path, value } of documents) {
    errors.push(...validateSpecificationDocument(value, path));
    allIds.push({ path, directives: value?.directives });
  }
  errors.push(...validateSpecificationIds(allIds, expectedNamespace));
  return errors;
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
