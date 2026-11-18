const sentenceClosers = new Set(['"', "'", "’", "”", ")", "]", "}"]);
function splitSentences(text) {
  const sentences = [];
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (!".!?".includes(text[index])) continue;
    let end = index + 1;
    while (end < text.length && (".!?".includes(text[end]) || sentenceClosers.has(text[end])))
      end += 1;
    if (text[end] && !/\s/u.test(text[end])) continue;
    const sentence = text.slice(start, end).trim();
    sentences.push(sentence);
    start = end;
    while (/\s/u.test(text[start] ?? "")) start += 1;
    index = end - 1;
  }
  const remaining = text.slice(start).trim();
  if (remaining) sentences.push(remaining);
  return sentences;
}
export default splitSentences;
