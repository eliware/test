const wordPattern =
  /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*(?:-[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*)*/gu;
export default function tokenizeWords(text) {
  return [...String(text).matchAll(wordPattern)].map(({ 0: word, index }) => ({
    word,
    index,
  }));
}
