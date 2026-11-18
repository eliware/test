const wordPattern =
  /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*(?:-[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*)*/gu;
function tokenizeWords(text) {
  return [...String(text).matchAll(wordPattern)].map(({ 0: word, index }) => ({
    word,
    index,
  }));
}
function normalizeSentence(text) {
  return tokenizeWords(text)
    .map(({ word }) => word.toLocaleLowerCase("en-US"))
    .join(" ");
}
export default normalizeSentence;
