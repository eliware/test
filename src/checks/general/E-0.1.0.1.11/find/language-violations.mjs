import { countWords, normalizeSentence, splitSentences } from "../word-tools.mjs";
import { stripNonProseText } from "../strip-nonprose-text.mjs";
import { findDictionaryViolations } from "./dictionary-violations.mjs";

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

function isExact(sentence, exactSentences) {
  return exactSentences.has(normalizeSentence(sentence));
}
