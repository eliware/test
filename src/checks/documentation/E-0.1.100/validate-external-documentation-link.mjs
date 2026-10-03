export function validateExternalDocumentationLink(reference) {
  if (/^mailto:/iu.test(reference)) {
    return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/iu.test(reference)
      ? null
      : `Documentation link is invalid: ${reference}.`;
  }
  try {
    const url = new URL(reference);
    const crossRepository =
      url.hostname.toLowerCase() === "github.com" && /^\/[^/]+\/[^/]+(?:\/|$)/u.test(url.pathname);
    return ["http:", "https:"].includes(url.protocol) &&
      (!crossRepository || url.protocol === "https:") &&
      url.hostname &&
      !url.username &&
      !url.password
      ? null
      : `Documentation link is invalid: ${reference}.`;
  } catch {
    return `Documentation link is invalid: ${reference}.`;
  }
}
