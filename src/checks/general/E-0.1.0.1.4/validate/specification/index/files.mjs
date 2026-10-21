import { basename } from "node:path";

export function inspectSpecificationIndexFiles(directory, files) {
  const yaml = files.filter(({ path }) => /\.ya?ml$/iu.test(path));
  const errors = [];
  if (!yaml.length) errors.push(`${directory} must contain at least one YAML specification.`);
  for (const { path } of files)
    if (!/\.ya?ml$/iu.test(path) && basename(path) !== "README.md")
      errors.push(`${path} is not an allowed specs file.`);
  return { yaml, errors };
}
