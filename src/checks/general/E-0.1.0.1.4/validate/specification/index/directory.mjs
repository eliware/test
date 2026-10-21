import { basename, join } from "node:path";
import { validateSpecificationIndexContent } from "./content.mjs";
import { inspectSpecificationIndexFiles } from "./files.mjs";

export async function validateSpecificationIndex(
  root,
  directory,
  { files, children, order, read },
) {
  const { yaml, errors } = inspectSpecificationIndexFiles(directory, files);
  if (order.directYamlFiles === "filename-ascending")
    yaml.sort((left, right) => basename(left.path).localeCompare(basename(right.path)));
  if (order.subdirectoryIndexes === "directory-name-ascending")
    children.sort((left, right) => basename(left).localeCompare(basename(right)));
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
