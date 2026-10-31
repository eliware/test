import { tokenizeWords } from "../word-tools.mjs";

const preparedDictionaries = new WeakMap();

export function prepareDictionaryTrie(dictionary) {
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
