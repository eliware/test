import { readCanonicalOrder } from "../../../validation/shared/conventions/read-canonical-order.mjs";

export function validatePackageKeyOrder(packageJson) {
  const canonicalKeys = readCanonicalOrder("package-json.yaml").topLevelKeys;
  const keys = Object.keys(packageJson ?? {});
  const positions = keys
    .map((key, index) => ({ key, index, order: canonicalKeys.indexOf(key) }))
    .filter(({ order }) => order >= 0);
  const ordered = [...positions].sort((left, right) => left.order - right.order);
  const firstOther = keys.findIndex((key) => !canonicalKeys.includes(key));
  const lastListed = positions.at(-1)?.index ?? -1;
  const listedOrderIsValid = positions.every((entry, index) => entry === ordered[index]);
  if (listedOrderIsValid && (firstOther < 0 || firstOther > lastListed)) return [];
  return [
    `package.json keys must follow canonical order: ${canonicalKeys.join(", ")}. Unlisted keys must follow listed keys.`,
  ];
}
