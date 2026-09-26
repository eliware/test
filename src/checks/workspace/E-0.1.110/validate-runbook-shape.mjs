export function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function stringList(value) {
  return Array.isArray(value) && value.length > 0 && value.every(nonEmptyString);
}

export function validRecord(record) {
  return (
    record &&
    typeof record === "object" &&
    !Array.isArray(record) &&
    nonEmptyString(record.id) &&
    nonEmptyString(record.purpose) &&
    nonEmptyString(record.owner) &&
    record.boundaries &&
    typeof record.boundaries === "object" &&
    !Array.isArray(record.boundaries) &&
    stringList(record.boundaries.owns) &&
    stringList(record.boundaries.excludes) &&
    stringList(record.steps)
  );
}
