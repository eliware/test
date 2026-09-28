import { commandTokens } from "./knit-command-tokens.mjs";
import { normalizeKnitExecutable } from "./normalize-knit-executable.mjs";

const allowedCommands = new Set(
  [
    ["git", "pull", "--ff-only", "origin", "main"],
    ["npm", "ci"],
    ["npm", "test"],
  ].map((tokens) => JSON.stringify(tokens)),
);

export function validateKnitPublicationCommands(calls) {
  const containsUnapprovedCommand = calls.some((call) => {
    const tokens = commandTokens(call);
    if (!tokens) return true;
    const executable = normalizeKnitExecutable(tokens[0]);
    return !executable || !allowedCommands.has(JSON.stringify([executable, ...tokens.slice(1)]));
  });
  return containsUnapprovedCommand
    ? ".knit/validate.mjs must contain only the approved synchronization and validation commands."
    : null;
}
