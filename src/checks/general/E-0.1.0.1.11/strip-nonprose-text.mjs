export function stripNonProseText(text) {
  return String(text)
    .replace(/`[^`]*`/gu, " ")
    .replace(/--[\w-]+\s+[A-Z][A-Z0-9_-]*\b/gu, " ")
    .replace(/\btransform\s*=\s*(?:"[^"]*"|'[^']*')/giu, " ")
    .replace(/\b(?:https?:\/\/|mailto:)[^\s)]+/giu, (url) => {
      const punctuation = url.match(/[.,!?;:]+$/u)?.[0] ?? "";
      return ` ${punctuation}`;
    });
}
