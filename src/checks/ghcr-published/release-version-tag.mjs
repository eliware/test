export const releaseTagFilter = "v[0-9]*.[0-9]*.[0-9]*";
export const releaseTagGuard =
  '[[ "${GITHUB_REF_NAME}" =~ ^v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$ ]] && test "$(npm pkg get version)" = "${GITHUB_REF_NAME#v}"';

const semanticVersionTag = /^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/u;

export function hasReleaseTagGuard(command) {
  return typeof command === "string" && command.trim() === releaseTagGuard;
}

export function tagMatchesPackageVersion(tag, version) {
  return semanticVersionTag.test(tag ?? "") && tag.slice(1) === version;
}

export function isTagRelease(env = process.env) {
  return env.GITHUB_REF_TYPE === "tag";
}
