import { countWords, normalizeSentence, splitSentences, tokenizeWords } from "./word-tools.mjs";

const preparedDictionaries = new WeakMap();

export function findLanguageViolations(path, blocks, dictionary, exactSentences) {
  const errors = [];
  for (const block of blocks) {
    if (block.kind === "directive") {
      if (isExact(block.text, exactSentences)) continue;
      const count = countWords(block.text);
      if (count > 20)
        errors.push(`${path}:${block.line} directive has ${count} words; limit is 20.`);
      if (block.text.includes(";"))
        errors.push(`${path}:${block.line} directive uses a semicolon.`);
      errors.push(...findDictionaryViolations(path, block, dictionary));
      continue;
    }
    const sentences = splitSentences(block.text);
    if (sentences.length > 6)
      errors.push(`${path}:${block.line} paragraph has ${sentences.length} sentences; limit is 6.`);
    sentences.forEach((sentence, index) => {
      if (isExact(sentence, exactSentences)) return;
      const count = countWords(sentence);
      if (count > 25)
        errors.push(`${path}:${block.line} sentence ${index + 1} has ${count} words; limit is 25.`);
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
          `${location} uses "${match}"; suggested alternatives: ${alternatives}.`,
          "These suggestions are not exhaustive or mandatory.",
          "Rewrite the text with clear, grammatical language without the listed term.",
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
