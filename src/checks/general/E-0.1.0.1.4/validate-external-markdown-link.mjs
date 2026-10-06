export function validateExternalLink(value) {
  if (/^mailto:/iu.test(value))
    return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/iu.test(value)
      ? null
      : `Documentation link is invalid: ${value}.`;
  try {
    const url = new URL(value);
    const github =
      url.hostname.toLowerCase() === "github.com" && /^\/[^/]+\/[^/]+(?:\/|$)/u.test(url.pathname);
    return ["http:", "https:"].includes(url.protocol) &&
      (!github || url.protocol === "https:") &&
      !url.username &&
      !url.password
      ? null
      : `Documentation link is invalid: ${value}.`;
  } catch {
    return `Documentation link is invalid: ${value}.`;
  }
}
