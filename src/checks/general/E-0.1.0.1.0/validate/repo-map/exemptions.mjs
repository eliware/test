function sameList(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((item, index) => item === expected[index])
  );
}

function sameValue(actual, expected) {
  if (Array.isArray(actual) || Array.isArray(expected))
    return (
      Array.isArray(actual) &&
      Array.isArray(expected) &&
      actual.length === expected.length &&
      actual.every((value, index) => sameValue(value, expected[index]))
    );
  if (actual && expected && typeof actual === "object" && typeof expected === "object") {
    const actualKeys = Object.keys(actual).sort();
    const expectedKeys = Object.keys(expected).sort();
    return (
      sameList(actualKeys, expectedKeys) &&
      actualKeys.every((key) => sameValue(actual[key], expected[key]))
    );
  }
  return actual === expected;
}

export function repoMapExemptionsMatch(packageJson, record) {
  const packageExemptions = Object.hasOwn(packageJson?.eliware ?? {}, "exempt")
    ? packageJson.eliware.exempt
    : [];
  const repoMapExemptions = Object.hasOwn(record, "exemptions") ? record.exemptions : [];
  return sameValue(packageExemptions, repoMapExemptions);
}
