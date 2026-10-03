import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseSingleYamlDocument } from "../parse-single-yaml-document.mjs";
import { fail, pass } from "../../../check-result.mjs";
import { isProhibitedPublishCommand } from "../E-0.1.24/is-prohibited-publish-command.mjs";

export const ruleId = "E-0.1.10.1";
export const parentRuleId = "E-0.1.10";

const requiredCommands = ["git pull --ff-only origin main", "npm ci", "npm test"];

// codescope ignore: Knit schema requires commands values to be arrays; nested deployment objects are traversed and malformed commands values are explicitly rejected
function findCommandLists(value, lists = []) {
  if (Array.isArray(value)) {
    for (const item of value) findCommandLists(item, lists);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (key === "commands") lists.push(item);
      findCommandLists(item, lists);
    }
  }
  return lists;
}

function validateCommandList(commands, index) {
  const label = `.knit/deploy.yaml commands list ${index + 1}`;
  if (!Array.isArray(commands)) return [`${label} must be an array.`];
  if (commands.length < requiredCommands.length)
    return [`${label} must begin with git pull, npm ci, and npm test.`];
  const prefixFailures = requiredCommands.flatMap((expected, commandIndex) =>
    commands[commandIndex] === expected
      ? []
      : [`${label} command ${commandIndex + 1} must be ${expected}.`],
  );
  const publishingCommands = commands
    .slice(requiredCommands.length)
    .filter(isProhibitedPublishCommand);
  return [
    ...prefixFailures,
    ...publishingCommands.map((command) => `${label} must not run publishing command: ${command}.`),
  ];
}

export async function run(context) {
  let document;
  const configPath = join(context.root, ".knit", "deploy.yaml");
  try {
    document = context.repositoryInventory
      ? await context.repositoryInventory.readParsed(
          configPath,
          "yaml-document",
          parseSingleYamlDocument,
        )
      : parseSingleYamlDocument(await readFile(configPath, "utf8"));
  } catch (error) {
    const message =
      error.code === "ENOENT"
        ? ".knit/deploy.yaml is required for Knit validation."
        : `.knit/deploy.yaml could not be parsed: ${error.message}`;
    return fail(ruleId, message);
  }

  const commandLists = findCommandLists(document);
  if (commandLists.length === 0)
    return fail(ruleId, ".knit/deploy.yaml must define Knit validation commands.");
  const failures = commandLists.flatMap(validateCommandList);
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
