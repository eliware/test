import { parseGitNulPaths } from "./paths.mjs";

export function parseGitIndexEntries(output) {
  return parseGitNulPaths(output).map((entry) => {
    const match = /^(\d{6}) ([0-9a-f]{40}|[0-9a-f]{64}) ([0-3])\t(.+)$/iu.exec(entry);
    if (!match) throw new Error("Git returned an invalid index entry.");
    return { mode: match[1], path: match[4] };
  });
}
