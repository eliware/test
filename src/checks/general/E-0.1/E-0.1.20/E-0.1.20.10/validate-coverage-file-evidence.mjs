function validCounter(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function requireMatchingSourceEntries(file, actual, expected, metric) {
  const actualKeys = Object.keys(actual ?? {}).sort();
  const expectedKeys = Object.keys(expected ?? {}).sort();
  if (
    actualKeys.length !== expectedKeys.length ||
    actualKeys.some((key, index) => key !== expectedKeys[index])
  ) {
    throw new Error(`Coverage report does not account for every source ${metric} entry in ${file}.`);
  }
}

export function validateCoverageFileEvidence(file, data, expectedShape = null) {
  const hasCounterData = Object.keys(data.s ?? {}).length > 0 || Object.keys(data.b ?? {}).length > 0 || Object.keys(data.f ?? {}).length > 0 || Object.keys(data.l ?? {}).length > 0;
  const hasMapData = Object.keys(data.statementMap ?? {}).length > 0 || Object.keys(data.branchMap ?? {}).length > 0 || Object.keys(data.fnMap ?? {}).length > 0 || Object.keys(data.lineMap ?? {}).length > 0;
  if (hasCounterData !== hasMapData) throw new Error(`Coverage evidence is incomplete for ${file}.`);
  for (const [map, counters, required] of [
    [data.statementMap, data.s, Object.hasOwn(data, "statementMap") || Object.hasOwn(data, "s")],
    [data.branchMap, data.b, Object.hasOwn(data, "branchMap") || Object.hasOwn(data, "b")],
    [data.fnMap, data.f, Object.hasOwn(data, "fnMap") || Object.hasOwn(data, "f")],
    [data.lineMap, data.l, Object.hasOwn(data, "lineMap")],
  ]) {
    const mapKeys = Object.keys(map ?? {});
    const counterKeys = Object.keys(counters ?? {});
    if (!required && !map) continue;
    if (!map || !counters || (mapKeys.length > 0 && counterKeys.length === 0)) throw new Error(`Coverage evidence is incomplete for ${file}.`);
    if (mapKeys.length !== counterKeys.length || mapKeys.some((key) => !Object.hasOwn(counters, key))) throw new Error(`Coverage map and counter keys do not match for ${file}.`);
  }
  if (expectedShape) {
    for (const [map, counters, metric] of [
      ["statementMap", "s", "statement"],
      ["branchMap", "b", "branch"],
      ["fnMap", "f", "function"],
    ]) {
      requireMatchingSourceEntries(file, data[map], expectedShape[map], metric);
      requireMatchingSourceEntries(file, data[counters], expectedShape[map], metric);
    }
    for (const [id, branch] of Object.entries(expectedShape.branchMap ?? {})) {
      if (
        !Array.isArray(data.branchMap?.[id]?.locations) ||
        data.branchMap[id].locations.length !== branch.locations.length ||
        !Array.isArray(data.b?.[id]) ||
        data.b[id].length !== branch.locations.length
      ) {
        throw new Error(`Coverage report does not account for every source branch path in ${file}.`);
      }
    }
  }
  const counterValues = [...Object.values(data.s ?? {}), ...Object.values(data.b ?? {}).flat(), ...Object.values(data.f ?? {}), ...Object.values(data.l ?? {})];
  if (counterValues.some((value) => !validCounter(value))) throw new Error(`Coverage evidence is malformed for ${file}.`);
}
