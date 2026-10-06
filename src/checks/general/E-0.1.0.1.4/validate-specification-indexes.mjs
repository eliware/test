import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, join, relative, sep } from "node:path";

export async function validateSpecificationIndexes(root, dependencies = {}) {
  const read = dependencies.read ?? readFile;
  const list = dependencies.readdir ?? readdir;
  let entries;
  try {
    entries = await walk(join(root, "specs"), join(root, "specs"), list);
  } catch {
    return ["specs/ is required to contain indexed YAML specifications."];
  }
  const directories = [
    "specs",
    ...entries.filter((entry) => entry.type === "directory").map((entry) => entry.path),
  ];
  const files = entries.filter((entry) => entry.type === "file");
  const errors = [];
  if (!files.some(({ path }) => path === "specs/directives.yaml"))
    errors.push("specs/directives.yaml is required.");
  for (const directory of directories) {
    const local = files.filter((entry) => dirname(entry.path).replaceAll("\\", "/") === directory);
    const yaml = local.filter(({ path }) => /\.ya?ml$/iu.test(path));
    const children = directories.filter(
      (child) => dirname(child).replaceAll("\\", "/") === directory,
    );
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
    const actual = [...index.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)].map(([, target]) => target);
    for (const target of expected)
      if (!actual.includes(target)) errors.push(`${directory}/README.md must link ${target}.`);
    for (const target of actual)
      if (!expected.includes(target))
        errors.push(`${directory}/README.md links to unexpected target ${target}.`);
    if (new Set(actual).size !== actual.length)
      errors.push(`${directory}/README.md must not duplicate index links.`);
  }
  return errors;
}

function isNavigationOnly(content) {
  return content
    .split(/\r?\n/u)
    .every(
      (line) =>
        !line.trim() || /^#{1,6}\s/u.test(line) || /^-\s*\[[^\]]+\]\([^)]+\)\s*$/u.test(line),
    );
}

async function walk(directory, root, list) {
  const result = [];
  for (const entry of await list(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    const rel = relative(root, path).split(sep).join("/");
    if (entry.isDirectory()) {
      result.push({ type: "directory", path: `specs/${rel}` });
      result.push(...(await walk(path, root, list)));
    } else if (entry.isFile()) result.push({ type: "file", path: `specs/${rel}` });
  }
  return result;
}
