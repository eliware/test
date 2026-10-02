import { readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const ignoredDirectories = new Set([".git", "node_modules", "coverage", "dist", "build"]);

export async function findJestConfigFiles(directory, repositoryInventory) {
  if (repositoryInventory) {
    const base = relative(resolve(repositoryInventory.root), resolve(directory)).replaceAll(
      "\\",
      "/",
    );
    if (base === ".." || base.startsWith("../") || base.includes(":"))
      throw new Error("Jest configuration directory must be inside the repository.");
    if (
      base &&
      !(await repositoryInventory.entries()).some(
        ({ path, type }) => path === base && type === "directory",
      )
    )
      throw Object.assign(new Error(`ENOENT: no such directory, scandir '${directory}'`), {
        code: "ENOENT",
      });
    const prefix = base ? `${base}/` : "";
    return (await repositoryInventory.files("all"))
      .filter(
        (file) =>
          file.startsWith(prefix) &&
          /^jest\.config(?:\..+)?$/iu.test(file.slice(prefix.length).split("/").at(-1)),
      )
      .map((file) => join(repositoryInventory.root, file));
  }
  const findings = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name))
        findings.push(...(await findJestConfigFiles(join(directory, entry.name))));
    } else if (/^jest\.config(?:\..+)?$/i.test(entry.name)) {
      findings.push(join(directory, entry.name));
    }
  }
  return findings;
}
