import { parse } from "@babel/parser";
import { inspectJestTestModule as inspectJestTestProgram } from "./inspect-jest-test-module.mjs";

export function inspectJestTestModule(content) {
  let ast;
  try {
    ast = parse(content, { sourceType: "module" });
  } catch {
    return { hasExecutableTest: false };
  }
  return inspectJestTestProgram(ast.program);
}
