import { parseBoundedYamlDocuments } from "../../../validation/shared/yaml/parse-bounded-yaml-documents.mjs";
import {
  findCommandLists,
  validateCommandList,
} from "./validate-knit-configuration/command-lists.mjs";
import { validateDeploymentTimeouts } from "./validate-knit-configuration/deployment-timeouts.mjs";

export async function validateKnitConfiguration(inventory) {
  if (!inventory?.files || !inventory.readText)
    return ["Knit configuration could not be inspected."];
  try {
    const files = await inventory.files("all");
    const yamlFiles = files.filter((path) => path.startsWith(".knit/") && /\.ya?ml$/iu.test(path));
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
    errors.push(...validateDeploymentTimeouts(document));
    const commandLists = findCommandLists(document);
    if (commandLists.length === 0) errors.push(".knit/deploy.yaml must define commands fields.");
    commandLists.forEach((commands, index) => errors.push(...validateCommandList(commands, index)));
    return errors;
  } catch (error) {
    return [`Knit configuration could not be inspected: ${error.message}`];
  }
}
