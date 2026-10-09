import { stat } from "node:fs/promises";
import { join } from "node:path";
import { validateInternalExportBarrels } from "../../application/E-0.1.4.1.2/validate-internal-export-barrels.mjs";
import { collectLibraryExportTargets } from "./collect-library-export-targets.mjs";

export async function validateLibraryEntrypoints(context = {}, dependencies = {}) {
  const packageJson = context.packageJson ?? {};
  const root = context.root ?? process.cwd();
  const checkFile = dependencies.stat ?? stat;
  const errors = [];
  const exportTargets = collectLibraryExportTargets(packageJson.exports);
  const runtime = [
    packageJson.main,
    ...exportTargets.filter((target) => !target.endsWith(".d.ts")),
  ];
  const declarations = [packageJson.types, packageJson.typings].filter(
    (target) => target !== undefined,
  );
  declarations.push(...exportTargets.filter((target) => target.endsWith(".d.ts")));
  if (!isRuntimeTarget(packageJson.main))
    errors.push("Libraries must declare a runtime main under src/.");
  if (packageJson.exports === undefined)
    errors.push("Libraries must declare package.json.exports.");
  if (!exportTargets.some((target) => isRuntimeTarget(target)))
    errors.push("package.json.exports must define runtime targets.");
  for (const target of runtime)
    errors.push(...(await validateTarget(root, target, "runtime", checkFile)));
  for (const target of declarations)
    errors.push(...(await validateTarget(root, target, "declaration", checkFile)));
  if (context.repositoryInventory) {
    const files = await context.repositoryInventory.files("all");
    const declared = new Set(declarations);
    for (const path of files.filter((file) => /^src\/.*\.d\.ts$/u.test(file))) {
      const target = `./${path}`;
      if (declared.has(target)) continue;
      declared.add(target);
      errors.push(...(await validateTarget(root, target, "declaration", checkFile)));
    }
    errors.push(
      ...(await validateInternalExportBarrels(
        files,
        context.repositoryInventory.readText,
        packageJson,
        root,
        { library: true },
      )),
    );
  }
  return errors;
}

async function validateTarget(root, target, kind, checkFile) {
  const label = kind === "runtime" ? "Library runtime entrypoint" : "Library declaration";
  if (!isSourceTarget(target, kind)) return [`${label} must target a file under src/: ${target}.`];
  try {
    if (!(await checkFile(join(root, target.slice(2)))).isFile()) throw new Error("not a file");
  } catch {
    return [`${label} target does not exist: ${target}.`];
  }
  if (kind === "declaration") {
    const companion = target.slice(0, -".d.ts".length) + ".mjs";
    try {
      if (!(await checkFile(join(root, companion.slice(2)))).isFile())
        throw new Error("not a file");
    } catch {
      return [`Library declaration must sit beside its same-basename .mjs file: ${target}.`];
    }
  }
  return [];
}

function isRuntimeTarget(target) {
  return typeof target === "string" && /\.(?:mjs|js)$/u.test(target);
}

function isSourceTarget(target, kind) {
  const extension = kind === "runtime" ? /\.(?:mjs|js)$/u : /\.d\.ts$/u;
  const segments = typeof target === "string" ? target.slice(2).split("/") : [];
  return (
    typeof target === "string" &&
    target.startsWith("./src/") &&
    !target.includes("\\") &&
    !/[?*]/u.test(target) &&
    !target.includes("[") &&
    !target.includes("]") &&
    !segments.some((segment) => !segment || segment === ".." || segment === ".") &&
    extension.test(target)
  );
}
