import { expect, test } from "@jest/globals";
import { buildSecretTextAutomaton } from "../../src/orchestration/build-secret-text-automaton.mjs";

test("builds trie transitions and failure output links", () => {
  const nodes = buildSecretTextAutomaton(["he", "she", "hers"], 100);
  const sh = nodes[nodes[0].transitions.get("s")].transitions.get("h");
  const she = nodes[sh].transitions.get("e");
  const he = nodes[nodes[0].transitions.get("h")].transitions.get("e");

  expect(nodes[she].failure).toBe(he);
  expect(nodes[she].outputLink).toBe(he);
  expect(nodes[he].lengths).toEqual([2]);
});

test("reuses trie prefixes and allows an empty secret collection", () => {
  const nodes = buildSecretTextAutomaton(["a", "a"], 100);
  expect(nodes).toHaveLength(2);
  expect(nodes[1].lengths).toEqual([1, 1]);
  expect(buildSecretTextAutomaton([], 0)).toHaveLength(1);
});

test("stops construction when insertion or failure-link work exceeds the budget", () => {
  expect(buildSecretTextAutomaton(["abcd"], 3)).toBeNull();
  expect(buildSecretTextAutomaton(["abx", "bcy"], 6)).toBeNull();
  expect(buildSecretTextAutomaton(["abx", "bcy"], 8)).toBeNull();
  expect(buildSecretTextAutomaton(["abx", "bcy"], 100)).not.toBeNull();
});

test("builds suffix fallback links across competing prefixes", () => {
  const nodes = buildSecretTextAutomaton(["abcd", "bcx"], 100);
  const ab = nodes[nodes[0].transitions.get("a")].transitions.get("b");
  const b = nodes[0].transitions.get("b");
  expect(nodes[ab].failure).toBe(b);
});
