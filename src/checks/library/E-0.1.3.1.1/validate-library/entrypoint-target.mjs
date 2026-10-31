import { join } from "node:path";

export async function validateLibraryEntrypointTarget(root, target, kind, checkFile) {
  const label = kind === "runtime" ? "Library runtime entrypoint" : "Library declaration";
  if (!isSourceTarget(target, kind)) return [`${label} must target a file under src/: ${target}.`];
  try {
    if (!(await checkFile(join(root, target.slice(2)))).isFile()) throw new Error("not a file");
  } catch {
    return [`${label} target does not exist: ${target}.`];
  }
  if (kind === "declaration") return validateDeclarationCompanion(root, target, checkFile);
  return [];
}

async function validateDeclarationCompanion(root, target, checkFile) {
  const companion = target.slice(0, -".d.ts".length) + ".mjs";
  try {
    if (!(await checkFile(join(root, companion.slice(2)))).isFile()) throw new Error("not a file");
    return [];
  } catch {
    return [`Library declaration must sit beside its same-basename .mjs file: ${target}.`];
  }
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
