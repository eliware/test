import findClockEffectViolations from "../clock-effect-violations.mjs";
import findEffectModuleViolations from "../effect-module-violations.mjs";
import findFetchViolations from "../network/fetch-violations.mjs";
import findProcessEffectViolations from "../network/process-effects.mjs";
import findHttpClientViolations from "../network/http-client/violations.mjs";
function findTestIsolationViolationsInAst(ast) {
  const findings = [
    ...findEffectModuleViolations(ast),
    ...findClockEffectViolations(ast),
    ...findFetchViolations(ast),
    ...findProcessEffectViolations(ast),
    ...findHttpClientViolations(ast),
  ];
  return [...new Set(findings)];
}
export default findTestIsolationViolationsInAst;
