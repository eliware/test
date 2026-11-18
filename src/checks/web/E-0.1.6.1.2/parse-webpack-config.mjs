import { parse } from "@babel/parser";
import readProperties from "./parse-webpack-config/read-properties.mjs";
export default function parseWebpackConfig(source) {
  try {
    const program = parse(source, {
      sourceType: "module",
    }).program;
    const defaultDeclarations = program.body.filter(
      (item) => item.type === "ExportDefaultDeclaration",
    );
    if (
      defaultDeclarations.length !== 1 ||
      defaultDeclarations[0].declaration.type !== "ObjectExpression"
    )
      return null;
    const properties = readProperties(defaultDeclarations[0].declaration);
    if (!properties) return null;
    return {
      program,
      properties,
    };
  } catch {
    return null;
  }
}
