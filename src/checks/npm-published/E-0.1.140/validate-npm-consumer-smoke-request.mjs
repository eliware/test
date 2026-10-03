import { resolve } from "node:path";
import { validatePublicationMetadata } from "./validate-publication-metadata.mjs";

export function validateNpmConsumerSmokeRequest({ root, target, packageJson }) {
  if (typeof target !== "string" || !target.trim())
    return { error: "Supply one existing consumer with --target <path>." };
  const metadataError = validatePublicationMetadata(packageJson, {
    selfHosted: packageJson?.name === "@eliware/test",
  });
  if (metadataError) return { error: metadataError };
  if (typeof packageJson?.name !== "string" || typeof packageJson?.version !== "string")
    return { error: "Source package name and version are required for tarball smoke." };
  const targetRoot = resolve(root, target);
  if (targetRoot === resolve(root))
    return { error: "Smoke target must be a separate consumer repository." };
  return { targetRoot };
}
