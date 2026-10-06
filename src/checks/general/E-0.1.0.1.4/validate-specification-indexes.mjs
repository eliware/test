import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { extractMarkdownLinks } from "./extract-markdown-links.mjs";
import { listSpecificationEntries } from "./list-specification-entries.mjs";

export async function validateSpecificationIndexes(root, dependencies = {}) {
  const read = dependencies.read ?? readFile;
  const list = dependencies.readdir ?? readdir;
  let entries;
  try {
    entries = await listSpecificationEntries(root, { list });
  } catch (error) {
    if (error.code === "ENOENT")
      return ["specs/ is required to contain indexed YAML specifications."];
    return [`Specification discovery failed: ${error.message}`];
  }
  const directories = [
    "specs",
    ...entries.filter((entry) => entry.type === "directory").map((entry) => entry.path),
  ];
  const files = entries.filter((entry) => entry.type === "file");
  const errors = [];
  errors.push(
    ...entries
      .filter((entry) => entry.type === "unsupported")
      .map(({ path }) => `${path} is an unsupported filesystem entry under specs/.`),
  );
  if (!files.some(({ path }) => path === "specs/directives.yaml"))
    errors.push("specs/directives.yaml is required.");
  for (const directory of directories) {
    const local = files.filter((entry) => dirname(entry.path).replaceAll("\\", "/") === directory);
    const yaml = local
      .filter(({ path }) => /\.ya?ml$/iu.test(path))
      .sort((left, right) => left.path.localeCompare(right.path));
    const children = directories
      .filter((child) => dirname(child).replaceAll("\\", "/") === directory)
      .sort((left, right) => left.localeCompare(right));
    if (!yaml.length) errors.push(`${directory} must contain at least one YAML specification.`);
    for (const { path } of local)
      if (!/\.ya?ml$/iu.test(path) && basename(path) !== "README.md")
        errors.push(`${path} is not an allowed specs file.`);
    let index;
    try {
      index = await read(join(root, directory, "README.md"), "utf8");
    } catch {
      errors.push(`${directory}/README.md is required to index its specifications.`);
      continue;
    }
    if (!isNavigationOnly(index))
      errors.push(`${directory}/README.md must be a navigation-only index.`);
    const expected = [
      ...yaml.map(({ path }) => basename(path)),
      ...children.map((path) => `${basename(path)}/README.md`),
    ];
    const actual = extractMarkdownLinks(index).map(({ reference }) => reference);
    for (const target of expected)
      if (!actual.includes(target)) errors.push(`${directory}/README.md must link ${target}.`);
    for (const target of actual)
      if (!expected.includes(target))
        errors.push(`${directory}/README.md links to unexpected target ${target}.`);
    if (new Set(actual).size !== actual.length)
      errors.push(`${directory}/README.md must not duplicate index links.`);
    if (actual.length === expected.length && JSON.stringify(actual) !== JSON.stringify(expected))
      errors.push(`${directory}/README.md must list index links in the required order.`);
  }
  return errors;
}

function isNavigationOnly(content) {
  return content
    .split(/\r?\n/u)
    .every(
      (line) =>
        !line.trim() ||
        /^#{1,6}\s/u.test(line) ||
        /^-\s*\[[^\]]+\](?:\([^)]+\)|\[[^\]]*\])\s*$/u.test(line) ||
        /^ {0,3}\[[^\]]+\]:\s*(?:<[^>]+>|\S+)(?:\s+.*)?$/u.test(line),
    );
}
