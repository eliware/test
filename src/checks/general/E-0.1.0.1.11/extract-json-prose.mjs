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

export function extractJsonProse(source) {
  let value;
  try {
    value = JSON.parse(source);
  } catch {
    return [];
  }
  const blocks = [];
  collect(value, [], blocks);
  return blocks;
}

function collect(value, path, blocks) {
  if (Array.isArray(value)) {
    for (const item of value) collect(item, path, blocks);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key.toLowerCase() === "examples") continue;
      collect(child, [...path, key.toLowerCase()], blocks);
    }
    return;
  }
  if (typeof value !== "string") return;
  const field = path.at(-1);
  if (!proseFields.has(field)) return;
  blocks.push({ text: value, line: 1, kind: "prose" });
}
