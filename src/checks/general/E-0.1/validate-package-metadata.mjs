function nonempty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function repositorySlug(packageJson, record) {
  const mapped = /^eliware\/([^/]+)$/u.exec(record?.repository ?? "");
  const named = /^@eliware\/([^/]+)$/u.exec(packageJson?.name ?? "");
  return mapped?.[1] ?? named?.[1] ?? null;
}

function hasCanonicalRepository(repository, slug) {
  return (
    repository &&
    typeof repository === "object" &&
    !Array.isArray(repository) &&
    Object.keys(repository).length === 2 &&
    repository.type === "git" &&
    repository.url === `git+https://github.com/eliware/${slug}.git`
  );
}

export function validatePackageMetadata(packageJson, record = null) {
  const errors = [];
  if (!nonempty(packageJson?.description))
    errors.push("package.json.description must be nonempty.");
  if (packageJson?.author !== "Eliware <eliware@eliware.org>")
    errors.push('package.json.author must be exactly "Eliware <eliware@eliware.org>".');
  if (packageJson?.license !== "MIT") errors.push('package.json.license must be "MIT".');

  const keywords = packageJson?.keywords;
  if (!Array.isArray(keywords) || !keywords.length || keywords.some((value) => !nonempty(value)))
    errors.push("package.json.keywords must be a non-empty array of non-empty strings.");
  else if (new Set(keywords).size !== keywords.length)
    errors.push("package.json.keywords must not contain duplicates.");

  const slug = repositorySlug(packageJson, record);
  if (!slug || !hasCanonicalRepository(packageJson?.repository, slug))
    errors.push("package.json.repository must be the canonical Eliware Git repository object.");
  if (!slug || packageJson?.homepage !== `https://github.com/eliware/${slug}#readme`)
    errors.push("package.json.homepage must be the canonical Eliware repository README URL.");
  return errors.length ? errors.join("\n") : null;
}
