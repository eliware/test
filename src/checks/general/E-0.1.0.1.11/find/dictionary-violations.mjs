import { tokenizeWords } from "../word-tools.mjs";

const preparedDictionaries = new WeakMap();

export function findDictionaryViolations(path, block, dictionary) {
  const entries = prepareDictionary(dictionary);
  const tokens = tokenizeWords(block.text);
  const errors = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const word = tokens[index].word.toLocaleLowerCase("en-US");
    for (const entry of entries.get(word) ?? []) {
      if (
        entry.tokens.every(
          (token, offset) => tokens[index + offset]?.word.toLocaleLowerCase("en-US") === token,
        )
      ) {
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
  }
  return errors;
}

function prepareDictionary(dictionary) {
  if (preparedDictionaries.has(dictionary)) return preparedDictionaries.get(dictionary);
  const entries = new Map();
  for (const [word, alternativeText] of Object.entries(dictionary)) {
    const tokens = tokenizeWords(word).map(({ word: token }) => token.toLocaleLowerCase("en-US"));
    if (!tokens.length) continue;
    const group = entries.get(tokens[0]) ?? [];
    const alternatives = alternativeText
      .split(",")
      .map((alternative) => alternative.trim())
      .filter(Boolean);
    group.push({ tokens, alternatives });
    entries.set(tokens[0], group);
  }
  preparedDictionaries.set(dictionary, entries);
  return entries;
}
