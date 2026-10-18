import { tokenizeWords } from "../word-tools.mjs";

const preparedDictionaries = new WeakMap();

export function findDictionaryViolations(path, block, dictionary) {
  const entries = prepareDictionary(dictionary);
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

function prepareDictionary(dictionary) {
  if (preparedDictionaries.has(dictionary)) return preparedDictionaries.get(dictionary);
  const root = createTrieNode();
  let order = 0;
  for (const [word, alternativeText] of Object.entries(dictionary)) {
    const tokens = tokenizeWords(word).map(({ word: token }) => token.toLocaleLowerCase("en-US"));
    if (!tokens.length) continue;
    let node = root;
    for (const token of tokens) {
      if (!node.children.has(token)) node.children.set(token, createTrieNode());
      node = node.children.get(token);
    }
    const alternatives = alternativeText
      .split(",")
      .map((alternative) => alternative.trim())
      .filter(Boolean);
    node.matches.push({ tokens, alternatives, order });
    order += 1;
  }
  preparedDictionaries.set(dictionary, root);
  return root;
}

function createTrieNode() {
  return { children: new Map(), matches: [] };
}
