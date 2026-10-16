import { countWords, normalizeSentence, splitSentences, tokenizeWords } from "./word-tools.mjs";
import { stripNonProseText } from "./strip-nonprose-text.mjs";

const preparedDictionaries = new WeakMap();

export function findLanguageViolations(path, blocks, dictionary, exactSentences) {
  const errors = [];
  for (const block of blocks) {
    const proseText = stripNonProseText(block.text);
    if (block.kind === "directive") {
      if (isExact(proseText, exactSentences)) continue;
      const count = countWords(proseText);
      if (count > 20) errors.push(`${path}:${block.line} directive has ${count} words. Limit: 20.`);
      if (proseText.includes(";")) errors.push(`${path}:${block.line} directive uses a semicolon.`);
      errors.push(...findDictionaryViolations(path, { ...block, text: proseText }, dictionary));
      continue;
    }
    const sentences = splitSentences(proseText);
    if (sentences.length > 6)
      errors.push(`${path}:${block.line} paragraph has ${sentences.length} sentences. Limit: 6.`);
    sentences.forEach((sentence, index) => {
      if (isExact(sentence, exactSentences)) return;
      const count = countWords(sentence);
      if (count > 25)
        errors.push(`${path}:${block.line} sentence ${index + 1} has ${count} words. Limit: 25.`);
      if (sentence.includes(";"))
        errors.push(`${path}:${block.line} sentence ${index + 1} uses a semicolon.`);
      errors.push(...findDictionaryViolations(path, { ...block, text: sentence }, dictionary));
    });
  }
  return errors;
}

function findDictionaryViolations(path, block, dictionary) {
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
        const location = `${path}:${block.line}`;
        const finding = [
          `${location} uses "${match}". Suggested alternatives: ${alternatives}.`,
          "The alternatives are examples. They are not requirements.",
          "Rewrite the text with grammatical wording that omits the listed term.",
        ].join(" ");
        errors.push(finding);
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

function isExact(sentence, exactSentences) {
  return exactSentences.has(normalizeSentence(sentence));
}
