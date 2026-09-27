import { access } from "node:fs/promises";
import { isWithinRegisteredRepository } from "./resolve-structured-reference.mjs";
import { referenceTarget } from "./reference-target.mjs";

export async function validateAuthorityReference({
  root,
  file,
  reference,
  label,
  registeredRepositoryRoots = [],
}) {
  const resolved = referenceTarget(root, file, reference);
  if (resolved.error) return `${label} ${resolved.error}.`;
  if (
    resolved.external &&
    !registeredRepositoryRoots.some((repositoryRoot) =>
      isWithinRegisteredRepository(resolved.target, repositoryRoot),
    )
  ) {
    return `${label} is outside every registered repository path: ${reference}.`;
  }
  try {
    await access(resolved.target);
  } catch {
    if (resolved.external) return null;
    return `${label} does not resolve: ${reference}.`;
  }
  return null;
}
