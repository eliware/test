import { parse } from "@babel/parser";
import findTestIsolationViolationsInAst from "./test-isolation-violations/find-test-isolation-violations-in-ast.mjs";
export default function findTestIsolationViolations(source) {
  let ast;
  try {
    ast = parse(source, {
      sourceType: "unambiguous",
      errorRecovery: true,
      plugins: ["jsx", "typescript"],
    });
  } catch {
    return ["could not parse the test module."];
  }
  return findTestIsolationViolationsInAst(ast);
}
