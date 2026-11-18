import { join } from "node:path";

export default async function findYamlExampleFiles(directory, list, files = []) {
  for (const entry of await list(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await findYamlExampleFiles(path, list, files);
    else if (entry.isFile() && /\.ya?ml$/iu.test(entry.name)) files.push(path);
  }
  return files;
}
