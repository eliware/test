import { validateAdapterHandlerPair } from "../../application/shared/validate-adapter-handler-pair.mjs";

export async function validateDiscordHandlerFiles(inventory, directory, names) {
  const errors = [];
  for (const name of names) {
    errors.push(
      ...(await validateAdapterHandlerPair(
        inventory,
        `${directory}/${name}.mjs`,
        `src/${directory}/${name}.mjs`,
        `../src/${directory}/${name}.mjs`,
      )),
    );
  }
  return errors;
}
