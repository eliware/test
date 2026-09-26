export function redactMatchedSecrets(text, matchEnds, limit = text.length) {
  let output = "";
  let cursor = 0;
  let rangeStart = -1;
  let rangeEnd = -1;
  for (let start = 0; start < limit; start += 1) {
    const end = matchEnds[start] ?? 0;
    if (end <= start || end > limit) continue;
    if (rangeStart < 0) {
      output += text.slice(cursor, start);
      rangeStart = start;
      rangeEnd = end;
    } else if (start <= rangeEnd) {
      rangeEnd = Math.max(rangeEnd, end);
    } else {
      output += `[REDACTED]${text.slice(rangeEnd, start)}`;
      rangeStart = start;
      rangeEnd = end;
    }
    cursor = rangeEnd;
  }
  if (rangeStart < 0) return text.slice(0, limit);
  return `${output}[REDACTED]${text.slice(cursor, limit)}`;
}

export function trimPartialSecretSuffix(text, secrets) {
  let safeLength = text.length;
  for (const secret of secrets) {
    const prefixLengths = Array.from({ length: secret.length }, () => 0);
    for (let index = 1, prefixLength = 0; index < secret.length; index += 1) {
      while (prefixLength > 0 && secret[index] !== secret[prefixLength]) {
        prefixLength = prefixLengths[prefixLength - 1];
      }
      if (secret[index] === secret[prefixLength]) prefixLength += 1;
      prefixLengths[index] = prefixLength;
    }

    let prefixLength = 0;
    const scanLimit = Math.min(text.length, secret.length - 1);
    for (let index = text.length - scanLimit; index < text.length; index += 1) {
      while (prefixLength > 0 && text[index] !== secret[prefixLength]) {
        prefixLength = prefixLengths[prefixLength - 1];
      }
      if (text[index] === secret[prefixLength]) prefixLength += 1;
    }
    safeLength = Math.min(safeLength, text.length - prefixLength);
  }
  return text.slice(0, safeLength);
}
