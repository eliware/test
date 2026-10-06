import { parseAllDocuments } from "yaml";
import { posix } from "node:path";

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
    const documents = parseAllDocuments(await inventory.readText(".knit/deploy.yaml"));
    const parseError = documents.flatMap((document) => document.errors)[0];
    if (parseError)
      return [...errors, `.knit/deploy.yaml could not be parsed: ${parseError.message}`];
    if (documents.length !== 1)
      return [...errors, ".knit/deploy.yaml must contain exactly one document."];
    const commandLists = findCommandLists(documents[0].toJS());
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
  const errors = prefix.flatMap((command, position) =>
    commands[position] === command ? [] : [`${label} must begin with ${prefix.join(", ")}.`],
  );
  for (const command of commands) {
    if (isProhibitedPublishCommand(command))
      errors.push(`${label} must not publish npm packages or GHCR images.`);
    if (/codescope/iu.test(command)) errors.push(`${label} must not invoke CodeScope.`);
    for (const [, script] of command.matchAll(
      /(?:^|[\s"'`])([^\s"'`;&|]+\.(?:mjs|cjs|js|sh|ps1|py|rb|ts))\b/giu,
    ))
      if (!posix.normalize(script.replaceAll("\\", "/")).startsWith(".knit/"))
        errors.push(`${label} must keep secondary scripts under .knit/: ${script}.`);
  }
  return errors;
}

function isProhibitedPublishCommand(command) {
  return [
    /\b(?:semantic-release|release-it|lerna\s+publish|changesets?\s+publish)\b/iu,
    /\b(?:npm|pnpm|yarn|bun)\s+(?:(?:--?[^\s]+)(?:\s+[^-\s][^\s]*)?\s+)*(?:npm\s+)?publish\b/iu,
    /\b(?:docker|podman|buildah)\s+push\b[^;\r\n]*(?:\bghcr\.io\/|\$\{?GHCR_[A-Z0-9_]+\}?)/iu,
    /\b(?:docker|podman|buildah)\s+(?:buildx\s+)?build\b[^;\r\n]*--push[^;\r\n]*(?:\bghcr\.io\/|\$\{?GHCR_[A-Z0-9_]+\}?)/iu,
    /\b(?:oras|crane)\s+push\b[^;\r\n]*\bghcr\.io\//iu,
    /\bskopeo\s+copy\b[^;\r\n]*docker:\/\/ghcr\.io\//iu,
  ].some((pattern) => pattern.test(command));
}
