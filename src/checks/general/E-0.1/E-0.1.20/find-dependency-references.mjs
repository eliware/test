import { collectScriptReferences } from "./collect-script-dependency-references.mjs";
import { scanDependencyFiles } from "./scan-dependency-files.mjs";
import { readDependencyBinaries } from "./read-dependency-binaries.mjs";
import { resolveSelfHostedScriptCommands } from "./resolve-self-hosted-script-commands.mjs";

export async function findDependencyReferences(
  root,
  packageJson,
  repositoryFiles,
  parseAst,
  inventory,
) {
  const declared = [
    ...new Set([
      ...Object.keys(packageJson?.dependencies ?? {}),
      ...Object.keys(packageJson?.devDependencies ?? {}),
      ...Object.keys(packageJson?.optionalDependencies ?? {}),
      ...Object.keys(packageJson?.peerDependencies ?? {}),
    ]),
  ];
  const referenced = new Set();
  const uncertain = { value: false };
  const dependencyBinaries = await readDependencyBinaries(root, declared);
  collectScriptReferences(packageJson?.scripts, declared, referenced, dependencyBinaries);
  for (const tool of ["jest", "prettier", "oxlint"])
    if (packageJson?.[tool] && declared.includes(tool)) referenced.add(tool);
  const selfHostedLint = resolveSelfHostedScriptCommands(["lint"]).scripts.lint;
  if (
    packageJson?.name === "@eliware/test" &&
    packageJson?.scripts?.lint === selfHostedLint &&
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
  const result = [...declared].filter((name) => referenced.has(name));
  result.uncertain = uncertain.value;
  return result;
}
