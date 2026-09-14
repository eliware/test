export function referencesResolve(contracts) {
  const ids = new Set(contracts.map(({ id }) => id));
  const edges = new Map(contracts.map(({ id }) => [id, []]));
  for (const contract of contracts) {
    const dependencies = contract.dependencies ?? [];
    if (!Array.isArray(dependencies)) return false;
    const references = [contract.parent, ...dependencies].filter(Boolean);
    if (references.some((reference) => !ids.has(reference))) return false;
    edges.set(contract.id, references);
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) return false;
    if (visited.has(id)) return true;
    visiting.add(id);
    for (const reference of edges.get(id)) if (!visit(reference)) return false;
    visiting.delete(id);
    visited.add(id);
    return true;
  }
  return [...ids].every(visit);
}
