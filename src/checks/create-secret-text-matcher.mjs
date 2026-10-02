import { buildSecretTextAutomaton } from "./build-secret-text-automaton.mjs";
import { scanSecretTextAutomaton } from "./scan-secret-text-automaton.mjs";

const MAX_SCAN_WORK = 1_000_000;

export function createSecretTextMatcher(secrets, { maxScanWork = MAX_SCAN_WORK } = {}) {
  const nodes = buildSecretTextAutomaton(secrets, maxScanWork);
  if (!nodes) return () => null;
  if (nodes.length === 1)
    return (text) =>
      text.length > maxScanWork ? null : Array.from({ length: text.length + 1 }, () => 0);

  function findSecretEnds(text) {
    const result = scanSecretTextAutomaton(nodes, text, maxScanWork);
    if (!result) return null;
    Object.defineProperty(result.matchEnds, "work", { value: result.work });
    return result.matchEnds;
  }

  findSecretEnds.createStream = () => {
    let state = 0;
    let offset = 0;
    return (text) => {
      const result = scanSecretTextAutomaton(nodes, text, maxScanWork, state, offset);
      if (!result) return null;
      state = result.state;
      offset += text.length;
      return { matches: result.matches, work: result.work };
    };
  };
  return findSecretEnds;
}
