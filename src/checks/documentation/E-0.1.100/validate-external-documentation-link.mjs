export function validateExternalDocumentationLink(reference) {
  if (/^mailto:/iu.test(reference)) {
    return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/iu.test(reference)
      ? null
      : `Documentation link is invalid: ${reference}.`;
  }
  try {
    const url = new URL(reference);
    return ["http:", "https:"].includes(url.protocol) && url.hostname
      ? null
      : `Documentation link is invalid: ${reference}.`;
  } catch {
    return `Documentation link is invalid: ${reference}.`;
  }
}
