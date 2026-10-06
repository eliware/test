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
  return errors.length ? errors.join("\n") : null;
}
