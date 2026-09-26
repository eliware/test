import { validateCoverageSourceShape } from "./validate-coverage-source-shape.mjs";

function validCounter(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function hasEvidence(data, fields) {
  return fields.some((field) => Object.keys(data[field] ?? {}).length > 0);
}

function requireMatchingMapCounters(file, data) {
  for (const [map, counters, required] of [
    [data.statementMap, data.s, Object.hasOwn(data, "statementMap") || Object.hasOwn(data, "s")],
    [data.branchMap, data.b, Object.hasOwn(data, "branchMap") || Object.hasOwn(data, "b")],
    [data.fnMap, data.f, Object.hasOwn(data, "fnMap") || Object.hasOwn(data, "f")],
    [data.lineMap, data.l, Object.hasOwn(data, "lineMap")],
  ]) {
    const mapKeys = Object.keys(map ?? {});
    const counterKeys = Object.keys(counters ?? {});
    if (!required && !map) continue;
    if (!map || !counters || (mapKeys.length > 0 && counterKeys.length === 0))
      throw new Error(`Coverage evidence is incomplete for ${file}.`);
    if (
      mapKeys.length !== counterKeys.length ||
      mapKeys.some((key) => !Object.hasOwn(counters, key))
    )
      throw new Error(`Coverage map and counter keys do not match for ${file}.`);
  }
}

export function validateCoverageFileEvidence(file, data, expectedShape = null) {
  const hasCounterData = hasEvidence(data, ["s", "b", "f", "l"]);
  const hasMapData = hasEvidence(data, ["statementMap", "branchMap", "fnMap", "lineMap"]);
  if (hasCounterData !== hasMapData)
    throw new Error(`Coverage evidence is incomplete for ${file}.`);
  requireMatchingMapCounters(file, data);
  if (expectedShape) validateCoverageSourceShape(file, data, expectedShape);
  const counterValues = [
    ...Object.values(data.s ?? {}),
    ...Object.values(data.b ?? {}).flat(),
    ...Object.values(data.f ?? {}),
    ...Object.values(data.l ?? {}),
  ];
  if (counterValues.some((value) => !validCounter(value)))
    throw new Error(`Coverage evidence is malformed for ${file}.`);
}
