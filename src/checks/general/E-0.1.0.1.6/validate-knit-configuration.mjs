import { parseBoundedYamlDocuments } from "../../../validation/shared/yaml/parse-bounded-yaml-documents.mjs";
import { posix } from "node:path";
import { isProhibitedNpmOrGhcrPublishCommand } from "../../shared/is-prohibited-npm-or-ghcr-publish-command.mjs";

const prefix = ["git pull --ff-only origin main", "npm ci", "npm test"];

export async function validateKnitConfiguration(inventory) {
  if (!inventory?.files || !inventory.readText)
    return ["Knit configuration could not be inspected."];
  try {
    const files = await inventory.files("all");
    const knitFiles = files.filter((path) => path.startsWith(".knit/"));
    const yamlFiles = knitFiles.filter((path) => /\.ya?ml$/iu.test(path));
    const errors = [];
    if (yamlFiles.length !== 1 || yamlFiles[0] !== ".knit/deploy.yaml")
      errors.push(".knit/deploy.yaml must be the only YAML file under .knit/.");
    if (!yamlFiles.includes(".knit/deploy.yaml")) return errors;
    const documents = parseBoundedYamlDocuments(
      await inventory.readText(".knit/deploy.yaml"),
      ".knit/deploy.yaml",
    );
    const parseError = documents.flatMap((document) => document.errors)[0];
    if (parseError)
      return [...errors, `.knit/deploy.yaml could not be parsed: ${parseError.message}`];
    if (documents.length !== 1)
      return [...errors, ".knit/deploy.yaml must contain exactly one document."];
    const document = documents[0].toJS();
    const events = document.on;
    const deployments = Array.isArray(events?.push?.deployments) ? events.push.deployments : [];
    if (deployments.length === 0) errors.push(".knit/deploy.yaml must define push deployments.");
    deployments.forEach((deployment, index) => {
      if (deployment?.timeoutMs !== 300000)
        errors.push(`.knit/deploy.yaml deployment ${index + 1} must set timeoutMs to 300000.`);
    });
    const tagActions = events?.tags && typeof events.tags === "object" ? events.tags : {};
    for (const [tag, action] of Object.entries(tagActions))
      if (Array.isArray(action?.deployments))
        action.deployments.forEach((deployment, index) => {
          if (deployment?.timeoutMs !== 300000)
            errors.push(
              `.knit/deploy.yaml tag ${tag} deployment ${index + 1} must set timeoutMs to 300000.`,
            );
        });
    const commandLists = findCommandLists(document);
    if (commandLists.length === 0) errors.push(".knit/deploy.yaml must define commands fields.");
    commandLists.forEach((commands, index) => errors.push(...validateCommands(commands, index)));
    return errors;
  } catch (error) {
    return [`Knit configuration could not be inspected: ${error.message}`];
  }
}

function findCommandLists(value, lists = []) {
  if (Array.isArray(value)) value.forEach((item) => findCommandLists(item, lists));
  else if (value && typeof value === "object")
    for (const [key, item] of Object.entries(value)) {
      if (key === "commands") lists.push(item);
      findCommandLists(item, lists);
    }
  return lists;
}

function validateCommands(commands, index) {
  const label = `.knit/deploy.yaml commands field ${index + 1}`;
  if (!Array.isArray(commands) || commands.some((command) => typeof command !== "string"))
    return [`${label} must be an array of strings.`];
  const errors =
    commands.length < prefix.length
      ? [`${label} must contain the full required command prefix.`]
      : [];
  errors.push(
    ...prefix
      .slice(0, commands.length)
      .flatMap((command, position) =>
        commands[position] === command ? [] : [`${label} must begin with ${prefix.join(", ")}.`],
      ),
  );
  for (const command of commands) {
    if (isProhibitedNpmOrGhcrPublishCommand(command))
      errors.push(`${label} must not publish npm packages or GHCR images.`);
    for (const [, script] of command.matchAll(
      /(?:^|[\s"'`])([^\s"'`;&|]+\.(?:mjs|mts|cjs|cts|js|jsx|tsx|ts|sh|ps1|py|rb))\b/giu,
    ))
      if (
        !script.toLowerCase().endsWith(".mjs") ||
        !posix.normalize(script.replaceAll("\\", "/")).startsWith(".knit/")
      )
        errors.push(`${label} must keep secondary scripts under .knit/ and use .mjs: ${script}.`);
  }
  return errors;
}
