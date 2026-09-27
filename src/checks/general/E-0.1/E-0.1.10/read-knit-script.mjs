import { join } from "node:path";
import { readRepositoryText } from "../../../read-repository-text.mjs";
import { parseKnitScript } from "./parse-knit-script.mjs";

const parserOptions = {
  sourceType: "module",
  plugins: ["importAttributes", "topLevelAwait"],
  allowUndeclaredExports: true,
};

export async function readKnitScript(context, { includeSource = true } = {}) {
  const { root, parseAst } = context;
  const source =
    includeSource || !parseAst
      ? await readRepositoryText(context, join(root, ".knit", "validate.mjs"))
      : "";
  let ast = null;
  if (parseAst) {
    try {
      ast = await parseAst(root, ".knit/validate.mjs", parserOptions);
    } catch (error) {
      return { source, error: `Knit validation script is not valid JavaScript: ${error.message}` };
    }
  }
  return { source, parsed: parseKnitScript(source, ast), ast };
}
