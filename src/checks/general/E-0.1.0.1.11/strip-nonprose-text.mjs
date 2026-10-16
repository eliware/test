export function stripNonProseText(text) {
  return String(text)
    .replace(/`[^`]*`/gu, " ")
    .replace(/\b(?:https?:\/\/|mailto:)[^\s)]+/giu, (url) => {
      const punctuation = url.match(/[.,!?;:]+$/u)?.[0] ?? "";
      return ` ${punctuation}`;
    });
}
