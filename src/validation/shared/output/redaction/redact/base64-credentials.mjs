const genericBase64Pattern =
  /(?<![A-Za-z0-9_./-])(?![A-Fa-f0-9]{32,}=?)(?=[A-Za-z0-9+/]{32,}={0,2}(?![A-Za-z0-9_./-]))[A-Za-z0-9+/]{32,}={0,2}(?![A-Za-z0-9_./-])/gu;

export function redactGenericBase64Credentials(text) {
  return String(text).replace(genericBase64Pattern, (token) =>
    isGenericBase64Credential(token) ? "[REDACTED]" : token,
  );
}

function isGenericBase64Credential(token) {
  if (/^[a-z]+(?:[A-Z][a-z]+){2,}$/u.test(token)) return false;
  if (/[0-9+=]/u.test(token)) return true;
  if (token.includes("/")) return false;
  const frequencies = new Map();
  for (const character of token) {
    frequencies.set(character, (frequencies.get(character) ?? 0) + 1);
  }
  const entropy = [...frequencies.values()].reduce((total, count) => {
    const probability = count / token.length;
    return total - probability * Math.log2(probability);
  }, 0);
  return entropy >= 4.2 && /[a-z]/u.test(token) && /[A-Z]/u.test(token);
}
