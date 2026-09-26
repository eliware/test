import { commandTokens } from "./knit-command-tokens.mjs";

const prohibitedCommand =
  /^(?:npm\s+(?:publish|login|adduser)|docker\s+(?:push|login)|kubectl\s+(?:apply|delete|patch|replace)|git\s+(?:tag|push|reset|clean)|(?:sudo\s+)?(?:reboot|shutdown|systemctl\s+(?:start|stop|restart))|rm\s+-rf)\b/iu;

export function validateKnitPublicationCommands(calls) {
  return calls.some((call) => prohibitedCommand.test(commandTokens(call).join(" ")))
    ? ".knit/validate.mjs must not publish, deploy, release, or mutate external state."
    : null;
}
