const proseFields = new Set([
  "description",
  "title",
  "purpose",
  "owner",
  "boundaries",
  "prerequisites",
  "steps",
  "prompt",
  "message",
  "help",
  "summary",
  "note",
  "notes",
  "support",
  "result",
  "expected",
  "scope",
  "acceptance",
  "content",
]);

export function isYamlProseField(field) {
  return proseFields.has(field);
}
