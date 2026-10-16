import { posix } from "node:path";
import { isProhibitedNpmOrGhcrPublishCommand } from "../../../shared/is/prohibited-npm-or-ghcr-publish-command.mjs";

const commandPrefix = ["git pull", "npm ci", "npm test"];
const scriptRunners = new Set([
  "node",
  "node.exe",
  "bun",
  "bun.exe",
  "deno",
  "deno.exe",
  "tsx",
  "ts-node",
  "python",
  "python3",
  "py",
  "bash",
  "sh",
  "pwsh",
  "powershell",
]);

export function findCommandLists(value, lists = []) {
  if (Array.isArray(value)) value.forEach((item) => findCommandLists(item, lists));
  else if (value && typeof value === "object")
    for (const [key, item] of Object.entries(value)) {
      if (key === "commands") lists.push(item);
      findCommandLists(item, lists);
    }
  return lists;
}

export function validateCommandList(commands, index = 0) {
  const label = `.knit/deploy.yaml commands field ${index + 1}`;
  if (!Array.isArray(commands) || commands.some((command) => typeof command !== "string"))
    return [`${label} must be an array of strings.`];
  const errors = checkCommandPrefix(commands, label);
  for (const command of commands) errors.push(...checkCommand(command, label));
  return errors;
}

function checkCommandPrefix(commands, label) {
  if (commands.length < commandPrefix.length)
    return [`${label} must contain the full required command prefix.`];
  return commandPrefix.every((command, position) => commands[position] === command)
    ? []
    : [`${label} must begin with ${commandPrefix.join(", ")}.`];
}

function checkCommand(command, label) {
  const errors = [];
  if (isProhibitedNpmOrGhcrPublishCommand(command))
    errors.push(`${label} must not publish npm packages or GHCR images.`);
  for (const script of findScriptPaths(command)) {
    if (!script.toLowerCase().endsWith(".mjs") || !isKnitPath(script))
      errors.push(`${label} must keep secondary scripts under .knit/ and use .mjs: ${script}.`);
  }
  return errors;
}

function findScriptPaths(command) {
  const tokens = [...command.matchAll(/"([^"]*)"|'([^']*)'|`([^`]*)`|([^\s"'`;&|]+)/gu)].map(
    (match) => match.slice(1).find((value) => value !== undefined),
  );
  const paths = new Set();
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) continue;
    const normalized = posix.normalize(token.replaceAll("\\", "/"));
    if (
      scriptRunners.has(token.toLowerCase()) &&
      tokens[index + 1] &&
      !tokens[index + 1].startsWith("-")
    )
      paths.add(tokens[index + 1]);
    if (/\.(?:mjs|mts|cjs|cts|js|jsx|tsx|ts|sh|ps1|py|rb)$/iu.test(token)) paths.add(token);
    else if (normalized.startsWith(".knit/") || normalized.startsWith("./")) paths.add(token);
  }
  return paths;
}

function isKnitPath(script) {
  return posix.normalize(script.replaceAll("\\", "/")).startsWith(".knit/");
}
