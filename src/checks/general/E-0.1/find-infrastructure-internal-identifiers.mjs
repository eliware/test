import { readFile } from "node:fs/promises";
import { join } from "node:path";

const internalLabel = ["eliware", "internal"].join("-");
const internalPatterns = [
  new RegExp(`(?:^|[^a-z0-9_-])${internalLabel}(?:$|[^a-z0-9_-])`, "i"),
  /\b(?:[a-z0-9-]+\.)*(?:internal|private)\.eliware\.org\b/i,
  /[a-z]:[\\/]+(?:users|home|srv|var[\\/]lib)[\\/]+[^\s"'`,;\])]+/i,
  /\/(?:home|users|srv|var\/lib)\/[^\s"'`,;\])]+/i,
  /(?:^|[^a-z0-9])(?:C:|D:)[\\/]+(?:eliware|Users[\\/]\w+[\\/]src)(?:[\\/]|$)/i,
  /(?:^|[^a-z0-9])file:\/\/(?:internal|private|[^/]+\.internal\.eliware\.org)(?:[\\/]|$)/i,
];

function containsBinaryControlCharacters(content) {
  for (const character of content) {
    const codePoint = character.codePointAt(0);
    if (
      (codePoint < 0x20 && ![0x09, 0x0a, 0x0d].includes(codePoint)) ||
      (codePoint >= 0x7f && codePoint <= 0x9f)
    ) {
      return true;
    }
  }
  return false;
}

export async function findInfrastructureInternalIdentifiers(
  root,
  files,
  { readBytes = (path) => readFile(path), skipMissingFiles = false } = {},
) {
  const findings = [];
  for (const file of files) {
    let bytes;
    try {
      bytes = await readBytes(join(root, file));
    } catch (error) {
      if (skipMissingFiles && error.code === "ENOENT") continue;
      throw error;
    }
    let content;
    try {
      content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      continue;
    }
    if (
      !containsBinaryControlCharacters(content) &&
      internalPatterns.some((pattern) => pattern.test(content))
    ) {
      findings.push(file);
    }
  }
  return findings;
}
