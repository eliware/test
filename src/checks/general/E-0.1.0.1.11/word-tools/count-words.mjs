const wordPattern =
  /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*(?:-[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*)*/gu;
function tokenizeWords(text) {
  return [...String(text).matchAll(wordPattern)].map(({ 0: word, index }) => ({
    word,
    index,
  }));
}
function countWords(text) {
  return tokenizeWords(text).length;
}
export default countWords;
