export function redactKnownTokenFormats(text) {
  return String(text)
    .replace(
      /((?:^|[\s,{])(?:AWS_SECRET_ACCESS_KEY|NPM_TOKEN|GH_TOKEN|CI_JOB_TOKEN)\s*=\s*)[^\s,;}]+/gimu,
      "$1[REDACTED]",
    )
    .replace(
      /\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|npm_[A-Za-z0-9_]{20,}|pypi-[A-Za-z0-9_-]+|sk-[A-Za-z0-9_-]+|xox[baprs]-[A-Za-z0-9_-]+|AIza[0-9A-Za-z_-]{20,}|AKIA[0-9A-Z]{16})\b/gu,
      "[REDACTED]",
    )
    .replace(
      /\b(?:ssh-(?:rsa|ed25519)|ecdsa-sha2-[A-Za-z0-9-]+)\s+[A-Za-z0-9+/=]+(?:\s+\S+)?/gu,
      "[REDACTED]",
    )
    .replace(
      /(?<![A-Za-z0-9_./-])(?![A-Fa-f0-9]{32,}=?)(?=[A-Za-z0-9+/]{32,}={0,2}(?![A-Za-z0-9_./-]))[A-Za-z0-9+/]{32,}={0,2}(?![A-Za-z0-9_./-])/gu,
      (token) => (isGenericBase64Credential(token) ? "[REDACTED]" : token),
    )
    .replace(/(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/gu, "[REDACTED]");
}

function isGenericBase64Credential(token) {
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
