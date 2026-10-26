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
  "content",
]);

export function isJsonProseField(field) {
  return proseFields.has(field);
}
