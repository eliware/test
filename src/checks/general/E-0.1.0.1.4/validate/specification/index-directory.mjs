import { basename, join } from "node:path";
import { extractMarkdownLinks } from "../../extract-markdown/links.mjs";

export async function validateSpecificationIndex(
  root,
  directory,
  { files, children, order, read },
) {
  const errors = [];
  const yaml = files.filter(({ path }) => /\.ya?ml$/iu.test(path));
  if (order.directYamlFiles === "filename-ascending")
    yaml.sort((left, right) => basename(left.path).localeCompare(basename(right.path)));
  if (order.subdirectoryIndexes === "directory-name-ascending")
    children.sort((left, right) => basename(left).localeCompare(basename(right)));
  if (!yaml.length) errors.push(`${directory} must contain at least one YAML specification.`);
  for (const { path } of files)
    if (!/\.ya?ml$/iu.test(path) && basename(path) !== "README.md")
      errors.push(`${path} is not an allowed specs file.`);
  let index;
  try {
    index = await read(join(root, directory, "README.md"), "utf8");
  } catch {
    errors.push(`${directory}/README.md is required to index its specifications.`);
    return errors;
  }
  if (!isNavigationOnly(index))
    errors.push(`${directory}/README.md must be a navigation-only index.`);
  const yamlTargets = yaml.map(({ path }) => basename(path));
  const childTargets = children.map((path) => `${basename(path)}/README.md`);
  const expected =
    order.placement === "after-yaml-files"
      ? [...yamlTargets, ...childTargets]
      : [...childTargets, ...yamlTargets];
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
