import remediationGuidance from "../../specs/convention-remediation.json" with { type: "json" };
import { bundledConventionVersion } from "./read-bundled-profile-authority.mjs";

const ignoredWords = new Set([
  "about",
  "after",
  "also",
  "and",
  "any",
  "are",
  "can",
  "contain",
  "does",
  "each",
  "from",
  "into",
  "must",
  "only",
  "provide",
  "repository",
  "should",
  "that",
  "their",
  "then",
  "this",
  "with",
]);

function words(value) {
  return new Set(
    (value.toLowerCase().match(/[a-z0-9]+(?:[._/-][a-z0-9]+)*/gu) ?? []).filter(
      (word) => word.length > 2 && !ignoredWords.has(word),
    ),
  );
}

export function selectRemediation(ruleId, message = "", guidance = remediationGuidance) {
  const directives = guidance.checks?.[ruleId]?.dos ?? [];
  const messageWords = words(message);
  const ranked = directives
    .map((directive, index) => ({
      directive,
      index,
      score: [...words(directive)].filter((word) => messageWords.has(word)).length,
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
  if (ranked.length === 0) return [];
  const bestScore = ranked[0].score;
  return bestScore > 0
    ? ranked
        .filter(({ score }) => score === bestScore)
        .slice(0, 2)
        .map(({ directive }) => directive)
    : [ranked[0].directive];
}

export function formatConventionFailure({ ruleId, message = "" }, guidance = remediationGuidance) {
  const fixes = selectRemediation(ruleId, message, guidance);
  const description = message || "The check failed without a diagnostic.";
  const remediation =
    fixes.length > 0
      ? fixes.join(" ")
      : `Update the bundled Convention v${guidance.version} remediation snapshot to include guidance for ${ruleId}.`;
  return `${ruleId}: ${description}\n  How to resolve: ${remediation}`;
}

export function validateRemediationCoverage(checks, guidance = remediationGuidance) {
  if (guidance.version !== bundledConventionVersion) {
    throw new Error(
      `Bundled remediation guidance must match Convention v${bundledConventionVersion}.`,
    );
  }
  const missing = checks
    .map(({ ruleId }) => ruleId)
    .filter(
      (ruleId) =>
        !Array.isArray(guidance.checks?.[ruleId]?.dos) || guidance.checks[ruleId].dos.length === 0,
    );
  if (missing.length > 0)
    throw new Error(`Bundled checks lack remediation guidance: ${missing.join(", ")}.`);
  return true;
}
