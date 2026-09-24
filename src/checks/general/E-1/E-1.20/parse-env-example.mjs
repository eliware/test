import { parseEnvironmentMetadata } from "./parse-env-metadata.mjs";
import { validateEnvironmentRecord } from "./validate-env-example-record.mjs";
import { parseEnvironmentLine } from "./parse-env-line.mjs";

export function parseEnvExample(content) {
  const records = new Map();
  const errors = [];
  let comments = [];
  for (const [index, line] of content.split(/\r?\n/u).entries()) {
    const parsedLine = parseEnvironmentLine(line);
    if (parsedLine.type === "comment") {
      comments.push(parsedLine.value);
      continue;
    }
    if (parsedLine.type !== "assignment") {
      if (parsedLine.type === "content") comments = [];
      continue;
    }
    const { name, value, optional } = parsedLine;
    const details = parseEnvironmentMetadata(comments.join(" "));
    const duplicate = records.has(name);
    records.set(name, { line: index + 1, value, optional, details });
    errors.push(...validateEnvironmentRecord({ name, value, optional, details, duplicate }));
    comments = [];
  }
  return { records, errors };
}
