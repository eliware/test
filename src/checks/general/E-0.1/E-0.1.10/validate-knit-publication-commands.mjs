import { commandTokens } from "./knit-command-tokens.mjs";

const prohibitedCommand =
  /^(?:npm\s+(?:publish|login|adduser)|docker\s+(?:push|login)|kubectl\s+(?:apply|delete|patch|replace)|git\s+(?:tag|push|reset|clean|checkout|restore|switch|add|commit|merge|rebase|cherry-pick|stash|apply|worktree|config|update-index|init|clone)|(?:sudo\s+)?(?:reboot|shutdown|systemctl\s+(?:start|stop|restart)))\b/iu;

export function validateKnitPublicationCommands(calls) {
  return calls.some((call) => {
    const tokens = commandTokens(call);
    return tokens && (prohibitedCommand.test(tokens.join(" ")) || isRecursiveRm(tokens));
  })
    ? ".knit/validate.mjs must not publish, deploy, release, or mutate external state."
    : null;
}

function isRecursiveRm([command, ...args]) {
  if (command.toLowerCase().replaceAll("\\", "/").split("/").at(-1) !== "rm") return false;
  for (const argument of args) {
    if (argument === "--") return false;
    if (/^--recursive(?:=|$)/iu.test(argument)) return true;
    if (/^-(?!-)[^-]*[rR]/u.test(argument)) return true;
  }
  return false;
}
