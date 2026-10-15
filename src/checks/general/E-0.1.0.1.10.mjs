import { fail, pass } from "../check-result.mjs";
import { findRepeatedParentNames } from "./E-0.1.0.1.10/find-repeated-parent-names.mjs";
import { planSourcePrefixMoves } from "./E-0.1.0.1.10/plan-source-prefix-moves.mjs";

export const ruleId = "E-0.1.0.1.10";

export async function run(context = {}) {
  const inventory = context.repositoryInventory;
  if (!inventory?.repositoryFiles) return fail(ruleId, "Repository files could not be inspected.");
  try {
    const files = (await inventory.repositoryFiles()).map((path) => path.replaceAll("\\", "/"));
    const sourceMoves = planSourcePrefixMoves(files);
    const testFindings = findTestMoveFindings(sourceMoves, files);
    const repeatedNames = findRepeatedParentNames(files.filter(isSourceOrTestModule));
    const findings = [
      ...sourceMoves.map(formatSourceMove),
      ...testFindings,
      ...repeatedNames.map(formatRepeatedName),
    ];
    return findings.length ? fail(ruleId, findings.join(" ")) : pass(ruleId);
  } catch (error) {
    return fail(ruleId, `Repository files could not be inspected: ${error.message}`);
  }
}

function findTestMoveFindings(sourceMoves, files) {
  const findings = [];
  for (const move of sourceMoves) {
    const sourceTest = sourceToTest(move.from);
    const targetTest = sourceToTest(move.to);
    if (files.includes(sourceTest) && !files.includes(targetTest)) {
      findings.push(`Move ${sourceTest} to ${targetTest} with its source module.`);
    }
  }
  return findings;
}

function sourceToTest(path) {
  return path.replace(/^src\//u, "tests/").replace(/\.mjs$/u, ".test.mjs");
}

function formatSourceMove({ from, to }) {
  return `Move ${from} to ${to}.`;
}

function formatRepeatedName(path) {
  return `${path} repeats its parent folder name in the file name.`;
}

function isSourceOrTestModule(path) {
  return (
    (path.startsWith("src/") && path.endsWith(".mjs")) ||
    (path.startsWith("tests/") && path.endsWith(".test.mjs"))
  );
}
