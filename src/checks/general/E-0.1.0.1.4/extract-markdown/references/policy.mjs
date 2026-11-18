export default function createMarkdownReferencePolicy() {
  return {
    definitionPattern: /^ {0,3}\[([^\]]+)\]:\s*(?:<([^>\r\n]+)>|(\S+))/gimu,
    normalizeLabel(value) {
      return value.trim().replace(/\s+/gu, " ").toLowerCase();
    },
  };
}
