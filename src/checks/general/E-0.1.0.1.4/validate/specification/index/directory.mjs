import { basename, join } from "node:path";
import { validateSpecificationIndexContent } from "./content.mjs";

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
  const yamlTargets = yaml.map(({ path }) => basename(path));
  const childTargets = children.map((path) => `${basename(path)}/README.md`);
  const expected =
    order.placement === "after-yaml-files"
      ? [...yamlTargets, ...childTargets]
      : [...childTargets, ...yamlTargets];
  return [
    ...errors,
    ...validateSpecificationIndexContent(index, `${directory}/README.md`, expected),
  ];
}
