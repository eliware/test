import { parse } from "@babel/parser";
import { findClockEffectViolations } from "./clock-effect-violations.mjs";
import { findEffectModuleViolations } from "./effect-module-violations.mjs";
import { findFetchViolations } from "./network/fetch-violations.mjs";
import { findProcessEffectViolations } from "./network/process-effects.mjs";
import { findHttpClientViolations } from "./network/http-client/violations.mjs";

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
  return findTestIsolationViolationsInAst(ast);
}

export function findTestIsolationViolationsInAst(ast) {
  const findings = [
    ...findEffectModuleViolations(ast),
    ...findClockEffectViolations(ast),
    ...findFetchViolations(ast),
    ...findProcessEffectViolations(ast),
    ...findHttpClientViolations(ast),
  ];
  return [...new Set(findings)];
}
