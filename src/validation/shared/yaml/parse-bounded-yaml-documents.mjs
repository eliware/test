import { parseAllDocuments } from "yaml";

export const yamlLimits = Object.freeze({
  bytes: 100000,
  lines: 1000,
  lineCharacters: 100,
  aliases: 100,
});

export function parseBoundedYamlDocuments(
  source,
  path,
  { lineCharacters = yamlLimits.lineCharacters } = {},
) {
  if (typeof source !== "string") throw new Error("source is not a string");
  const limitError = findYamlLimitError(source, path, lineCharacters);
  if (limitError) throw new Error(limitError);
  const documents = parseAllDocuments(source);
  for (const document of documents) {
    if (document.errors.length) continue;
    try {
      document.toJS({ maxAliasCount: yamlLimits.aliases });
    } catch (error) {
      if (/excessive alias count/iu.test(error.message))
        throw new Error(
          `${path} has more than 100 expanded aliases in one document. limit is 100.`,
        );
      throw error;
    }
  }
  return documents;
}

export function parseBoundedYamlValue(source, path) {
  const [document, ...remaining] = parseBoundedYamlDocuments(source, path);
  if (remaining.length) throw new Error(`${path} must contain one YAML document.`);
  if (!document) return null;
  const parseError = document?.errors[0];
  if (parseError) throw parseError;
  return document?.toJS({ maxAliasCount: yamlLimits.aliases });
}

function findYamlLimitError(source, path, lineCharacters) {
  const bytes = Buffer.byteLength(source, "utf8");
  if (bytes > yamlLimits.bytes) return `${path} is ${bytes} UTF-8 bytes. limit is 100000.`;
  const lines = source.split(/\r\n|\n|\r/u);
  if (lines.at(-1) === "" && /(?:\r\n|\n|\r)$/u.test(source)) lines.pop();
  if (lines.length > yamlLimits.lines) return `${path} has ${lines.length} lines. limit is 1000.`;
  for (const [index, line] of lines.entries()) {
    const characters = Array.from(line).length;
    if (characters > lineCharacters)
      return `${path} line ${index + 1} has ${characters} characters. limit is ${lineCharacters}.`;
  }
  return null;
}
