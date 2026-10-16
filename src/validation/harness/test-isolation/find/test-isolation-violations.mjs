import { parse } from "@babel/parser";
import { findClockEffectViolations } from "./clock-effect-violations.mjs";
import { findEffectModuleViolations } from "./effect-module-violations.mjs";
import { findNetworkProcessViolations } from "./network-process-violations.mjs";

export function findTestIsolationViolations(source) {
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
  return findTestIsolationViolationsInAst(ast, source);
}

export function findTestIsolationViolationsInAst(ast, source) {
  const findings = [
    ...findEffectModuleViolations(ast),
    ...findClockEffectViolations(ast),
    ...findNetworkProcessViolations(ast, source),
  ];
  return [...new Set(findings)];
}
