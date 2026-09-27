export function createPartialSecretSuffixTrimmer(secrets) {
  const patterns = secrets.map((secret) => {
    const prefixLengths = Array.from({ length: secret.length }, () => 0);
    for (let index = 1, prefixLength = 0; index < secret.length; index += 1) {
      while (prefixLength > 0 && secret[index] !== secret[prefixLength]) prefixLength = prefixLengths[prefixLength - 1];
      if (secret[index] === secret[prefixLength]) prefixLength += 1;
      prefixLengths[index] = prefixLength;
    }
    return { secret, prefixLengths };
  });
  return function trimPartialSecretSuffix(text) {
    let safeLength = text.length;
    for (const { secret, prefixLengths } of patterns) {
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
  };
}

export function trimPartialSecretSuffix(text, secrets) {
  return createPartialSecretSuffixTrimmer(secrets)(text);
}
