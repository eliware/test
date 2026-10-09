import { parse } from "@babel/parser";

export async function validateDiscordHandlerFiles(inventory, directory, names) {
  const errors = [];
  for (const name of names) {
    const adapter = `${directory}/${name}.mjs`;
    const source = `src/${directory}/${name}.mjs`;
    try {
      const adapterAst = parse(await inventory.readText(adapter), { sourceType: "module" });
      if (!isMatchingAdapter(adapterAst, directory, name))
        errors.push(`${adapter} must re-export its matching source handler.`);
    } catch (error) {
      errors.push(`${adapter} could not be inspected: ${error.message}`);
    }
    try {
      const sourceAst = parse(await inventory.readText(source), { sourceType: "module" });
      if (!hasDefaultFunction(sourceAst)) errors.push(`${source} must default-export a function.`);
    } catch (error) {
      errors.push(`${source} could not be inspected: ${error.message}`);
    }
  }
  return errors;
}

function isMatchingAdapter(ast, directory, name) {
  if (ast.program.body.length !== 1) return false;
  const statement = ast.program.body[0];
  if (statement.type !== "ExportNamedDeclaration" || statement.specifiers.length !== 1)
    return false;
  const item = statement.specifiers[0];
  return (
    statement.source?.value === `../src/${directory}/${name}.mjs` &&
    item.type === "ExportSpecifier" &&
    item.local.name === "default" &&
    item.exported.name === "default"
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
