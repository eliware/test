function list(value) {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",").map((item) => item.trim())
      : null;
  return values?.length && values.every((item) => typeof item === "string" && item.trim())
    ? values
    : null;
}

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

export function validateRepoMapMetadata(packageJson, record) {
  if (
    typeof record?.id !== "string" ||
    !/^E-\d+$/u.test(record.id) ||
    typeof record.repository !== "string" ||
    !/^eliware\/[^/]+$/u.test(record.repository) ||
    typeof record.description !== "string" ||
    !record.description.trim()
  )
    return "repo-map.yaml repository entry is missing valid identity metadata.";
  const keywords = list(record.keywords);
  const profiles = list(record.profiles);
  if (!keywords || !profiles)
    return "repo-map.yaml repository entry must contain keywords and profiles.";
  const errors = [];
  if (packageJson?.eliware?.id !== record.id)
    errors.push("package.json.eliware.id must match repo-map.yaml.");
  if (packageJson?.description !== record.description)
    errors.push("package.json.description must match repo-map.yaml.");
  if (!sameList(packageJson?.keywords, keywords))
    errors.push("package.json.keywords must match repo-map.yaml.");
  if (!sameList(packageJson?.eliware?.apply, profiles))
    errors.push("package.json.eliware.apply must match repo-map.yaml.");
  const packageExemptions = Object.hasOwn(packageJson?.eliware ?? {}, "exempt")
    ? packageJson.eliware.exempt
    : [];
  const repoMapExemptions = Object.hasOwn(record, "exemptions") ? record.exemptions : [];
  if (!sameValue(packageExemptions, repoMapExemptions))
    errors.push("The package exemption list must match repo-map.yaml.");
  return errors.length ? errors.join("\n") : null;
}
