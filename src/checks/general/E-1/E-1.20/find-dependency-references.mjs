import { collectScriptReferences } from "./collect-script-dependency-references.mjs";
import { scanDependencyFiles } from "./scan-dependency-files.mjs";

export async function findDependencyReferences(root, packageJson) {
  const declared = [
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {}),
    ...Object.keys(packageJson?.optionalDependencies ?? {}),
    ...Object.keys(packageJson?.peerDependencies ?? {}),
  ];
  const referenced = new Set();
  const uncertain = { value: false };
  collectScriptReferences(packageJson?.scripts, declared, referenced);
  for (const tool of ["jest", "prettier", "oxlint"])
    if (packageJson?.[tool] && declared.includes(tool)) referenced.add(tool);
  await scanDependencyFiles(root, declared, referenced, uncertain);
  const result = declared.filter((name) => referenced.has(name));
  result.uncertain = uncertain.value;
  return result;
}
