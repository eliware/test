const assignment = /^\s*(#\s*)?([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/;
import { parseEnvironmentMetadata } from "./parse-env-metadata.mjs";
import { validateEnvironmentRecord } from "./validate-env-example-record.mjs";

function normalizeValue(value) {
  return value.replace(/^(["'])(.*)\1$/, "$2").trim();
}

export function parseEnvExample(content) {
  const records = new Map();
  const errors = [];
  let comments = [];
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    const match = assignment.exec(line);
    if (!match) {
      if (trimmed.startsWith("#")) {
        comments.push(trimmed.slice(1).trim());
        continue;
      }
      if (trimmed) comments = [];
      continue;
    }
    const [, comment, name, rawValue] = match;
    const value = normalizeValue(rawValue);
    const details = parseEnvironmentMetadata(comments.join(" "));
    const duplicate = records.has(name);
    records.set(name, { line: index + 1, value, optional: Boolean(comment), details });
    errors.push(...validateEnvironmentRecord({
      name,
      value,
      optional: Boolean(comment),
      details,
      duplicate,
    }));
    comments = [];
  }
  return { records, errors };
}
