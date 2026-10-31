import { validateLibraryEntrypointTarget } from "./entrypoint-target.mjs";

export async function validateLibraryRuntimeEntrypoints(
  root,
  packageJson,
  exportTargets,
  checkFile,
) {
  const errors = [];
  if (!isRuntimeTarget(packageJson.main))
    errors.push("Libraries must declare a runtime main under src/.");
  if (packageJson.exports === undefined)
    errors.push("Libraries must declare package.json.exports.");
  if (!exportTargets.some(isRuntimeTarget))
    errors.push("package.json.exports must define runtime targets.");
  const targets = [
    packageJson.main,
    ...exportTargets.filter((target) => !target.endsWith(".d.ts")),
  ];
  for (const target of targets)
    errors.push(...(await validateLibraryEntrypointTarget(root, target, "runtime", checkFile)));
  return errors;
}

function isRuntimeTarget(target) {
  return typeof target === "string" && /\.(?:mjs|js)$/u.test(target);
}
