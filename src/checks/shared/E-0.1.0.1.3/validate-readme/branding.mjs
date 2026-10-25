import { readCanonicalOrder } from "../../../../validation/shared/conventions/read-canonical-order.mjs";

function repoUrl(packageJson) {
  const value =
    typeof packageJson?.repository === "string"
      ? packageJson.repository
      : packageJson?.repository?.url;
  return typeof value === "string"
    ? value
        .replace(/^git\+/u, "")
        .replace(/\.git$/u, "")
        .replace(/\/$/u, "")
    : "";
}

export function validateReadmeBranding(readme, packageJson = {}) {
  const name = packageJson?.name;
  const repository = repoUrl(packageJson);
  const slug = repository.replace("https://github.com/eliware/", "");
  if (!/^@eliware\/[\w.-]+$/u.test(name ?? "") || !slug || name !== `@eliware/${slug}`)
    return "package.json must define a package name and GitHub repository for README badges.";
  const order = readCanonicalOrder("readme-sections.yaml");
  const includeNpm = packageJson?.eliware?.apply?.includes("npm-published");
  const template = order.headerTemplates;
  const badgeNames = includeNpm
    ? order.badgeOrder
    : order.badgeOrder.filter((badge) => badge !== "npm");
  const privateRepository = packageJson?.eliware?.apply?.includes("private");
  const badgeLine = `${template.title.replace("@eliware/<repo-name>", name)} ${badgeNames
    .map((badge) => {
      const key =
        badge === "License" && privateRepository
          ? "privateLicenseBadge"
          : `${badge.toLowerCase()}Badge`;
      return template[key]
        ?.replaceAll("<repo-name>", slug)
        .replaceAll("<license>", encodeURIComponent(packageJson?.license ?? ""));
    })
    .join(" ")}`;
  const lines = readme.split(/\r?\n/u);
  return lines[0] === template.brand && lines[2] === badgeLine
    ? null
    : "README.md must start with the canonical logo header and title badge row.";
}
