import {
  validateAuthorityRegistryEntryShape,
  validateAuthorityRegistryShape,
} from "./validate-authority-registry-shape.mjs";
import { validateAuthorityRegistryReferences } from "./validate-authority-registry-references.mjs";
import { validateAuthorityRegistryGovernance } from "./validate-authority-registry-governance.mjs";
import { validateAuthorityRegistryDelegation } from "./validate-authority-registry-delegation.mjs";
import { validateAuthorityRegistryDirectiveNamespaces } from "./validate-authority-registry-directive-namespaces.mjs";

export async function validateAuthorityRegistry({ root, file, entries }) {
  const shapeError = validateAuthorityRegistryShape(entries);
  if (shapeError) return shapeError;
  const repositories = new Set(
    entries
      .filter((entry) => entry && typeof entry.repository === "string")
      .map((entry) => entry.repository),
  );
  const governedTargets = new Set();
  for (const [index, entry] of entries.entries()) {
    const entryShapeError = validateAuthorityRegistryEntryShape(entry, index);
    if (entryShapeError) return entryShapeError;
    const referenceError = await validateAuthorityRegistryReferences({
      root,
      file,
      entry,
    });
    if (referenceError) return referenceError;
    const governanceError = validateAuthorityRegistryGovernance(entry, governedTargets);
    if (governanceError) return governanceError;
    const delegationError = validateAuthorityRegistryDelegation(entry, repositories);
    if (delegationError) return delegationError;
    const namespaceError = validateAuthorityRegistryDirectiveNamespaces(entry);
    if (namespaceError) return namespaceError;
  }
  return null;
}
