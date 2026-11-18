import { parse } from "@babel/parser";
import findTestIsolationViolationsInAst from "./test-isolation/find/test-isolation-violations/find-test-isolation-violations-in-ast.mjs";
import findTestWritePolicyViolationsInAst from "./test-write-policy/scan/source/find-test-write-policy-violations-in-ast.mjs";
export default function findTestPolicyViolations(source, filePath) {
  let ast;
  try {
    ast = parse(source, {
      sourceType: "unambiguous",
      errorRecovery: true,
      plugins: ["jsx", "typescript"],
    });
  } catch {
    return [`${filePath}: could not parse the test module.`];
  }
  return [
    ...findTestWritePolicyViolationsInAst(ast, filePath),
    ...findTestIsolationViolationsInAst(ast, source).map((finding) => `${filePath}: ${finding}`),
  ];
}
