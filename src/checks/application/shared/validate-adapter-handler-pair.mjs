import { parse } from "@babel/parser";

export async function validateAdapterHandlerPair(inventory, adapter, handler, targetImport) {
  const errors = [];
  try {
    const ast = parse(await inventory.readText(adapter), { sourceType: "module" });
    if (!reexportsHandler(ast, targetImport))
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

function reexportsHandler(ast, targetImport) {
  if (ast.program.body.length !== 1) return false;
  const statement = ast.program.body[0];
  if (statement.type !== "ExportNamedDeclaration" || statement.specifiers.length !== 1)
    return false;
  const specifier = statement.specifiers[0];
  return (
    statement.source?.value === targetImport &&
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
