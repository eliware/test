import { isAbsolute, relative, resolve, sep } from "node:path";
import { validatePublicationMetadata } from "../../pack/validate/publication-metadata.mjs";
import { validateSourcePackageIdentity } from "./source-package-identity.mjs";

export function validateNpmConsumerSmokeRequest({ root, target, packageJson }) {
  if (typeof target !== "string" || !target.trim())
    return { error: "Supply one existing consumer with --target <path>." };
  const metadataError = validatePublicationMetadata(packageJson, {
    selfHosted: packageJson?.name === "@eliware/test",
  });
  if (metadataError) return { error: metadataError };
  const identityError = validateSourcePackageIdentity(packageJson);
  if (identityError) return { error: identityError };
  const targetRoot = resolve(root, target);
  const sourceRoot = resolve(root);
  if (containsOrMatches(sourceRoot, targetRoot) || containsOrMatches(targetRoot, sourceRoot))
    return { error: "Smoke target must be a separate consumer repository." };
  return { targetRoot };
}

function containsOrMatches(parent, path) {
  const relativePath = relative(parent, path);
  return (
    relativePath === "" ||
    (relativePath !== ".." && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath))
  );
}
