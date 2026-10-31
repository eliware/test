import { expect, test } from "@jest/globals";
import { prepareDictionaryTrie } from "../../../../../src/checks/general/E-0.1.0.1.11/find/prepare-dictionary-trie.mjs";

test("builds a trie with normalized tokens, alternatives, and source order", () => {
  const dictionary = { "Close to": " NEAR (prep), CLOSE ", close: "NEARBY (adj)", "": "skip" };
  const trie = prepareDictionaryTrie(dictionary);
  expect(trie.children.get("close").matches).toEqual([
    { tokens: ["close"], alternatives: ["NEARBY (adj)"], order: 1 },
  ]);
  expect(trie.children.get("close").children.get("to").matches).toEqual([
    { tokens: ["close", "to"], alternatives: ["NEAR (prep)", "CLOSE"], order: 0 },
  ]);
  expect(prepareDictionaryTrie(dictionary)).toBe(trie);
});
