export function findRepositoryRecord(values, packageJson) {
  const match = /^@eliware\/([^/]+)$/u.exec(packageJson?.name ?? "");
  if (!match) return { record: null, error: "The package name cannot identify a repo-map entry." };
  const repository = `eliware/${match[1]}`;
  const records = values.flatMap((document) =>
    document.repositories.filter((candidate) => candidate?.repository === repository),
  );
  if (records.length > 1)
    return { record: null, error: `repo-map.yaml has duplicate entries for ${repository}.` };
  return { record: records[0] ?? null, error: null };
}
