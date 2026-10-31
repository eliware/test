import { validateLibraryEntrypointTarget } from "./entrypoint-target.mjs";

export async function validateLibraryDeclarationEntrypoints(
  root,
  packageJson,
  exportTargets,
  files,
  checkFile,
) {
  const errors = [];
  const declarations = [packageJson.types, packageJson.typings].filter(
    (target) => target !== undefined,
  );
  declarations.push(...exportTargets.filter((target) => target.endsWith(".d.ts")));
  const declared = new Set(declarations);
  for (const path of files.filter((file) => /^src\/.*\.d\.ts$/u.test(file))) {
    const target = `./${path}`;
    if (declared.has(target)) continue;
    declared.add(target);
    declarations.push(target);
  }
  for (const target of declarations)
    errors.push(...(await validateLibraryEntrypointTarget(root, target, "declaration", checkFile)));
  return errors;
}
