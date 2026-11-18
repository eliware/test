export default function findPrunedAncestor(base, prunedDirectories) {
  let candidate = "";
  for (const part of base ? base.split("/") : []) {
    candidate = candidate ? `${candidate}/${part}` : part;
    if (prunedDirectories.has(candidate)) return candidate;
  }
  return undefined;
}
