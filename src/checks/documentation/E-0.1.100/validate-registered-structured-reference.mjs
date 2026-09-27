import { stat } from "node:fs/promises";
import { isWithinRegisteredRepository } from "./resolve-structured-reference.mjs";

export async function validateRegisteredStructuredReference({
  reference,
  target,
  registeredRepositoryRoots,
  registryError,
  statTarget = stat,
}) {
  if (registeredRepositoryRoots === null) {
    throw new Error(
      `${reference} cannot be verified without the registered repository map: ${registryError}`,
    );
  }
  if (
    !registeredRepositoryRoots.some((repositoryRoot) =>
      isWithinRegisteredRepository(target, repositoryRoot),
    )
  ) {
    throw new Error(`${reference} is outside every registered repository path`);
  }
  try {
    await statTarget(target);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
