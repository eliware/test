import { createIncrementalSearchWindow } from "./search-window.mjs";
import { hasValidSecretMatchResults } from "../../has-valid-secret-match-results.mjs";
import { createSecretSearchWorkBudget } from "./work-budget.mjs";
import { attachAppendTextAdapter } from "./secret-search/append-text.mjs";

export function createIncrementalSearch(values, workLimit, createStream) {
  const findNewMatches = createStream();
  const window = createIncrementalSearchWindow(values);
  const hasWorkBudget = createSecretSearchWorkBudget(workLimit);

  function findSafeBoundary(pending, includePendingMatches = false) {
    const appended = window.appendedText(pending);
    if (appended.suppressed) return { boundary: 0, matchEnds: [], suppressed: true };
    const result = searchAppended(appended.text, pending.length, includePendingMatches);
    if (!result.suppressed) window.rememberPending(pending, result.boundary);
    return result;
  }

  return attachAppendTextAdapter(findSafeBoundary, searchAppended);

  function searchAppended(appended, pendingLength, includePendingMatches) {
    if (
      typeof appended !== "string" ||
      !Number.isSafeInteger(pendingLength) ||
      pendingLength < appended.length
    )
      return { boundary: 0, matchEnds: [], suppressed: true };
    const pendingStart = window.bufferStart;
    const pendingEnd = pendingStart + pendingLength;
    const found = findNewMatches(appended);
    if (!hasValidSecretMatchResults(found, pendingStart, pendingEnd))
      return { boundary: 0, matchEnds: [], suppressed: true };
    if (!hasWorkBudget(found.work)) return { boundary: 0, matchEnds: [], suppressed: true };

    return window.applyMatches(found.matches, pendingLength, includePendingMatches);
  }
}
