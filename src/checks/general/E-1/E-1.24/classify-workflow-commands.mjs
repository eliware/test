const publicationPattern = /^(?:npm\s+publish|docker\s+push|ghcr\.io|kubectl\s+apply|git\s+push|git\s+tag)\b/iu;
const forbiddenPublicationPattern = /\b(?:npm\s+publish|docker\s+push|ghcr\.io|kubectl\s+apply|git\s+push|git\s+tag)\b/iu;
const allowedValidationPattern = /^(?:npm\s+ci|npm\s+test)$/iu;
const allowedSetupPattern = /^(?:echo|printf|node\s+--version|npm\s+--version)\b/iu;

export function findPublicationCommand(commands) {
  return commands.find(({ command }) => publicationPattern.test(command));
}

export function findUnsupportedCommands(commands) {
  return commands
    .filter(({ command }) => {
      const value = command.trim();
      return (!allowedValidationPattern.test(value) && !allowedSetupPattern.test(value))
        || forbiddenPublicationPattern.test(value);
    })
    .map(({ command }) => command);
}
