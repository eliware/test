import semver from "semver";
import { bundledConventionVersion } from "../../../orchestrators/read-bundled-profile-catalog.mjs";

const nonempty = (value) => typeof value === "string" && value.trim().length > 0;

export function validatePackageMetadata(packageJson) {
  const errors = [];
  const name = packageJson?.name;
  const match = typeof name === "string" ? /^@eliware\/([^/\s]+)$/u.exec(name) : null;
  if (!match) errors.push("package.json.name must be a scoped @eliware name.");
  const version = packageJson?.version;
  if (
    typeof version !== "string" ||
    !/^\d+\.\d+\.\d+$/u.test(version) ||
    semver.valid(version, { loose: false }) !== version ||
    version.split(".").slice(0, 2).join(".") !== bundledConventionVersion
  )
    errors.push(
      `package.json.version must be numeric MAJOR.MINOR.PATCH for Convention v${bundledConventionVersion}.`,
    );
  if (!nonempty(packageJson?.description))
    errors.push("package.json.description must be nonempty.");
  const keywords = packageJson?.keywords;
  if (
    !Array.isArray(keywords) ||
    keywords.length === 0 ||
    keywords.some((word) => !nonempty(word))
  ) {
    errors.push("package.json.keywords must contain nonempty strings.");
  } else if (new Set(keywords).size !== keywords.length) {
    errors.push("package.json.keywords must be distinct.");
  }
  if (typeof packageJson?.private !== "boolean")
    errors.push("package.json.private must be boolean.");
  if (packageJson?.author !== "Eliware <eliware@eliware.org>")
    errors.push("package.json.author must use the canonical Eliware value.");
  if (packageJson?.license !== "MIT") errors.push('package.json.license must be "MIT".');
  if (packageJson?.type !== "module") errors.push('package.json.type must be "module".');
  if (packageJson?.engines?.node !== "26") errors.push('package.json.engines.node must be "26".');
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
  return errors;
}
