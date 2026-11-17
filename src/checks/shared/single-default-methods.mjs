import { join, posix } from "node:path";
import { parse } from "@babel/parser";
import { isPureExportBarrel } from "./is/pure-export-barrel.mjs";

export async function validateSingleDefaultMethods(
  files,
  readText,
  packageJson,
  root,
  options = {},
) {
  if (packageJson.name === "@eliware/test") return [];
  const errors = [];
  for (const path of files.filter((file) => /^src\/.*\.mjs$/u.test(file))) {
    if (options.library && isLibraryMain(path, packageJson)) continue;
    let source;
    try {
      source = await readText(join(root, path));
    } catch {
      errors.push(`${path} could not be read to check its exported methods.`);
      continue;
    }
    if (isPureExportBarrel(source)) continue;
    let program;
    try {
      program = parse(source, { sourceType: "module" }).program;
    } catch {
      errors.push(`${path} could not be parsed to check its exported methods.`);
      continue;
    }
    const counts = countExportedMethods(program.body);
    if (counts.named > 0) errors.push(`${path} must use a default export for its method.`);
    if (counts.total > 1) errors.push(`${path} exports more than one method.`);
  }
  return errors;
}

function isLibraryMain(path, packageJson) {
  if (typeof packageJson.main !== "string") return false;
  const main = posix.normalize(packageJson.main.replaceAll("\\", "/").replace(/^\.\//u, ""));
  return path === main;
}

function countExportedMethods(body) {
  const localMethods = new Set();
  for (const node of body) {
    const declaration = node.type === "ExportNamedDeclaration" ? node.declaration : node;
    if (declaration?.type === "FunctionDeclaration" && declaration.id)
      localMethods.add(declaration.id.name);
    if (declaration?.type === "VariableDeclaration")
      for (const item of declaration.declarations)
        if (isFunction(item.init) && item.id.type === "Identifier") localMethods.add(item.id.name);
  }
  let total = 0;
  let named = 0;
  for (const node of body) {
    if (
      node.type === "ExportDefaultDeclaration" &&
      isExportedFunction(node.declaration, localMethods)
    )
      total += 1;
    if (node.type !== "ExportNamedDeclaration") continue;
    const declarations = node.declaration;
    if (declarations?.type === "FunctionDeclaration") {
      total += 1;
      named += 1;
    } else if (declarations?.type === "VariableDeclaration") {
      for (const item of declarations.declarations)
        if (isFunction(item.init) && item.id.type === "Identifier") {
          total += 1;
          named += 1;
        }
    }
    for (const specifier of node.specifiers) {
      if (node.source || !localMethods.has(specifier.local.name)) continue;
      total += 1;
      if (specifier.exported.name !== "default") named += 1;
    }
  }
  return { total, named };
}

function isExportedFunction(node, localMethods) {
  return isFunction(node) || (node.type === "Identifier" && localMethods.has(node.name));
}

function isFunction(node) {
  return ["ArrowFunctionExpression", "FunctionExpression", "FunctionDeclaration"].includes(
    node?.type,
  );
}
