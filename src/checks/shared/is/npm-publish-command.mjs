const npmPublishPattern =
  /\b(?:npm|pnpm|yarn|bun)(?:@[^\s]+)?\s+(?:(?:--?[^\s]+)(?:\s+[^-\s][^\s]*)?\s+)*(?:npm(?:@[^\s]+)?\s+)?publish\b/iu;
export default function isNpmPublishCommand(command) {
  return typeof command === "string" && npmPublishPattern.test(command);
}
