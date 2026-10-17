const pathPattern = /(?:^|[^a-z0-9])\/(?:home|users|srv)\/[^\s"'`,;\])]+/giu;
const containerPathRoots = [
  ["", "home", "node"].join("/"),
  ["", "home", "argocd"].join("/"),
  ["", "home", "runner"].join("/"),
  ["", "srv", "repository"].join("/"),
  ["", "srv", "workspace"].join("/"),
];

export function hasPosixMachineSpecificPath(content) {
  return [...content.matchAll(pathPattern)].some(([match]) => {
    const path = match.slice(match.indexOf("/")).replace(/[.,!?`]+$/u, "");
    return !containerPathRoots.some((root) => path === root || path.startsWith(`${root}/`));
  });
}
