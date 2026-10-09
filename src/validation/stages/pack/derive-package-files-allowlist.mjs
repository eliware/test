import { readCanonicalOrder } from "../../shared/conventions/read-canonical-order.mjs";

export function derivePackageFilesAllowlist(packageJson) {
  const profiles = packageJson?.eliware?.apply ?? [];
  const order = readCanonicalOrder("package-files.yaml");
  const entries = [...order.baseEntries];
  for (const profile of order.profileEntryOrder) {
    if (profiles.includes(profile) && order.profileEntries[profile]) {
      entries.push(order.profileEntries[profile]);
    }
  }
  entries.push(...(order.packageEntries[packageJson?.name] ?? []));
  if (packageJson?.files?.includes(".env.example")) entries.push(".env.example");
  return entries;
}
