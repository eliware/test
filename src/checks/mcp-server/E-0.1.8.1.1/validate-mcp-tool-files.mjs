import { parse } from "@babel/parser";

export async function validateMcpToolFiles(files, inventory) {
  const adapters = listNames(files, "tools");
  const handlers = listNames(files, "src/tools");
  const errors = [];
  if (!adapters.length) errors.push("tools/ must contain at least one tool adapter.");
  errors.push(...findMissingPairErrors(adapters, handlers));
  for (const name of adapters) errors.push(...(await validateAdapter(inventory, name)));
  return errors;
}

function listNames(files, directory) {
  return files
    .filter((path) => path.startsWith(`${directory}/`) && path.endsWith(".mjs"))
    .map((path) => path.slice(directory.length + 1, -4))
    .filter((name) => !name.includes("/"));
}

function findMissingPairErrors(adapters, handlers) {
  return [
    ...adapters
      .filter((name) => !handlers.includes(name))
      .map((name) => `src/tools/${name}.mjs is required.`),
    ...handlers
      .filter((name) => !adapters.includes(name))
      .map((name) => `tools/${name}.mjs is required.`),
  ];
}

async function validateAdapter(inventory, name) {
  const adapter = `tools/${name}.mjs`;
  const handler = `src/tools/${name}.mjs`;
  const errors = [];
  try {
    const ast = parse(await inventory.readText(adapter), { sourceType: "module" });
    if (!reexportsMatchingHandler(ast, name))
      errors.push(`${adapter} must re-export its matching source handler.`);
  } catch (error) {
    errors.push(`${adapter} could not be inspected: ${error.message}`);
  }
  try {
    const ast = parse(await inventory.readText(handler), { sourceType: "module" });
    if (!hasDefaultFunction(ast)) errors.push(`${handler} must default-export a function.`);
  } catch (error) {
    errors.push(`${handler} could not be inspected: ${error.message}`);
  }
  return errors;
}

function reexportsMatchingHandler(ast, name) {
  if (ast.program.body.length !== 1) return false;
  const statement = ast.program.body[0];
  if (statement.type !== "ExportNamedDeclaration" || statement.specifiers.length !== 1)
    return false;
  const specifier = statement.specifiers[0];
  return (
    statement.source?.value === `../src/tools/${name}.mjs` &&
    specifier.type === "ExportSpecifier" &&
    specifier.local.name === "default" &&
    specifier.exported.name === "default"
  );
}

function hasDefaultFunction(ast) {
  const declaration = ast.program.body.find(
    (node) => node.type === "ExportDefaultDeclaration",
  )?.declaration;
  return ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(
    declaration?.type,
  );
}
