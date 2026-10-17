import { validateAdapterHandlerPair } from "../../application/shared/validate-adapter-handler-pair.mjs";

export async function validateMcpToolFiles(files, inventory) {
  const adapters = listNames(files, "tools");
  const handlers = listNames(files, "src/tools");
  const errors = [];
  errors.push(...findNestedPathErrors(files, "tools"));
  errors.push(...findNestedPathErrors(files, "src/tools"));
  if (!adapters.length) errors.push("tools/ must contain at least one tool adapter.");
  errors.push(...findMissingPairErrors(adapters, handlers));
  for (const name of adapters) errors.push(...(await validateAdapter(inventory, name)));
  return errors;
}

function findNestedPathErrors(files, directory) {
  return files
    .filter((path) => path.startsWith(`${directory}/`) && path.endsWith(".mjs"))
    .filter((path) => path.slice(directory.length + 1).includes("/"))
    .map((path) => `${path} must be directly under ${directory}/.`);
}

function listNames(files, directory) {
  return files
    .filter((path) => path.startsWith(`${directory}/`) && path.endsWith(".mjs"))
    .map((path) => path.slice(directory.length + 1, -4))
    .filter((name) => !name.includes("/"));
}

function findMissingPairErrors(adapters, handlers) {
  return [
    ...adapters
      .filter((name) => !handlers.includes(name))
      .map((name) => `src/tools/${name}.mjs is required.`),
    ...handlers
      .filter((name) => !adapters.includes(name))
      .map((name) => `tools/${name}.mjs is required.`),
  ];
}

async function validateAdapter(inventory, name) {
  return validateAdapterHandlerPair(
    inventory,
    `tools/${name}.mjs`,
    `src/tools/${name}.mjs`,
    `../src/tools/${name}.mjs`,
  );
}
