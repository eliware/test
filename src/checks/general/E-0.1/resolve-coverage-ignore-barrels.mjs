import { findPureBarrels } from "./E-0.1.20/find-pure-barrels.mjs";
import { findLibraryEntryPoints } from "./E-0.1.5/find-library-entrypoints.mjs";

export async function resolveCoverageIgnoreBarrels(
  root,
  packageJson,
  repositoryInventory,
  findBarrels = findPureBarrels,
) {
  const barrels = new Set(await findBarrels(root, undefined, repositoryInventory));
  const profiles = packageJson?.eliware?.apply ?? [];
  const supportsBarrelExemption = profiles.some(
    (profile) => profile === "application" || profile === "library",
  );
  const allowedBarrels = new Set(
    supportsBarrelExemption
      ? findLibraryEntryPoints({
          ...packageJson,
          eliware: { ...packageJson.eliware, apply: [...profiles, "library"] },
        })
      : [],
  );
  return { barrels, allowedBarrels };
}
