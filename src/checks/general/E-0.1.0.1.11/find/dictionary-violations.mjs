import { tokenizeWords } from "../word-tools.mjs";
import { prepareDictionaryTrie } from "./prepare-dictionary-trie.mjs";

export function findDictionaryViolations(path, block, dictionary) {
  const entries = prepareDictionaryTrie(dictionary);
  const tokens = tokenizeWords(block.text);
  const errors = [];
  for (let index = 0; index < tokens.length; index += 1) {
    let node = entries;
    const matches = [];
    for (let offset = 0; index + offset < tokens.length; offset += 1) {
      const word = tokens[index + offset].word.toLocaleLowerCase("en-US");
      node = node.children.get(word);
      if (!node) break;
      matches.push(...node.matches);
    }
    for (const entry of matches.sort((left, right) => left.order - right.order)) {
      const match = tokens
        .slice(index, index + entry.tokens.length)
        .map(({ word }) => word)
        .join(" ");
      const alternatives = entry.alternatives.length
        ? entry.alternatives.join(", ")
        : "none listed";
      errors.push(
        `${path}:${block.line} uses "${match}". Suggested alternatives: ${alternatives}.`,
      );
    }
  }
  return errors;
}
