export function validatePackageIdentity(packageJson) {
  const errors = [];
  const name = packageJson?.name;
  const match = typeof name === "string" ? /^@eliware\/([^/\s]+)$/u.exec(name) : null;
  if (!match) errors.push("package.json.name must be a scoped @eliware name.");
  if (packageJson?.author !== "Eliware <eliware@eliware.org>")
    errors.push("package.json.author must use the canonical Eliware value.");
  const slug = match?.[1];
  const repository = packageJson?.repository;
  if (
    !slug ||
    !repository ||
    typeof repository !== "object" ||
    Array.isArray(repository) ||
    Object.keys(repository).length !== 2 ||
    repository.type !== "git" ||
    repository.url !== `git+https://github.com/eliware/${slug}.git`
  )
    errors.push("package.json.repository must use the canonical Eliware Git URL.");
  if (!slug || packageJson?.homepage !== `https://github.com/eliware/${slug}#readme`)
    errors.push("package.json.homepage must use the canonical Eliware README URL.");
  if (!slug || packageJson?.bugs?.url !== `https://github.com/eliware/${slug}/issues`)
    errors.push("package.json.bugs.url must use the matching GitHub issues URL.");
  return errors;
}
