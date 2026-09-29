import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { collectScriptReferences } from "./collect-script-dependency-references.mjs";
import { scanDependencyFiles } from "./scan-dependency-files.mjs";

async function readDependencyBinaries(root, declared) {
  try {
    const lock = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
    const binaries = new Map();
    for (const dependency of declared) {
      const entry = lock.packages?.[`node_modules/${dependency}`];
      const names =
        typeof entry?.bin === "string"
          ? [dependency.split("/").at(-1)]
          : Object.keys(entry?.bin ?? {});
      for (const name of names) {
        const owners = binaries.get(name) ?? [];
        owners.push(dependency);
        binaries.set(name, owners);
      }
    }
    return new Map(
      [...binaries]
        .filter(([, owners]) => owners.length === 1)
        .map(([name, owners]) => [name, owners[0]]),
    );
  } catch {
    return new Map();
  }
}

export async function findDependencyReferences(
  root,
  packageJson,
  repositoryFiles,
  parseAst,
  inventory,
) {
  const declared = [
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {}),
    ...Object.keys(packageJson?.optionalDependencies ?? {}),
    ...Object.keys(packageJson?.peerDependencies ?? {}),
  ];
  const referenced = new Set();
  const uncertain = { value: false };
  const dependencyBinaries = await readDependencyBinaries(root, declared);
  collectScriptReferences(packageJson?.scripts, declared, referenced, dependencyBinaries);
  for (const tool of ["jest", "prettier", "oxlint"])
    if (packageJson?.[tool] && declared.includes(tool)) referenced.add(tool);
  if (
    packageJson?.name === "@eliware/test" &&
    packageJson?.scripts?.lint?.includes("--lint") &&
    declared.includes("oxlint")
  )
    referenced.add("oxlint");
  await scanDependencyFiles(
    root,
    declared,
    referenced,
    uncertain,
    repositoryFiles,
    parseAst,
    inventory,
    dependencyBinaries,
  );
  const result = declared.filter((name) => referenced.has(name));
  result.uncertain = uncertain.value;
  return result;
}
