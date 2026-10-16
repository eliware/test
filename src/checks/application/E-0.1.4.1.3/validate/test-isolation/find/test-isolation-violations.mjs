import { parse } from "@babel/parser";
import { findClockEffectViolations } from "./clock-effect-violations.mjs";
import { findEffectModuleViolations } from "./effect-module-violations.mjs";
import { findNetworkProcessViolations } from "./network-process-violations.mjs";

export function findTestIsolationViolations(source) {
  let ast;
  try {
    ast = parse(source, { sourceType: "unambiguous", errorRecovery: true, plugins: ["jsx"] });
  } catch {
    return ["could not parse the test module."];
  }
  const findings = [
    ...findEffectModuleViolations(ast),
    ...findClockEffectViolations(ast),
    ...findNetworkProcessViolations(ast, source),
  ];
  return [...new Set(findings)];
}
