const pathPatterns = [
  /[a-z]:[\\/]+(?:users|home|srv|var[\\/]lib)[\\/]+[^\s"'`,;\])]+/iu,
  /(?:^|[^a-z0-9])(?:C:|D:)[\\/]+(?:eliware|Users[\\/]\w+[\\/]src)(?:[\\/]|$)/iu,
];
const posixPathPattern = /(?:^|[^a-z0-9])\/(?:home|users|srv)\/[^\s"'`,;\])]+/giu;
const containerPathRoots = [
  ["", "home", "node"].join("/"),
  ["", "home", "argocd"].join("/"),
  ["", "home", "runner"].join("/"),
  ["", "srv", "repository"].join("/"),
  ["", "srv", "workspace"].join("/"),
];

export async function findMachineSpecificPaths(files, readBytes) {
  const findings = [];
  for (const file of files) {
    const content = decodeText(await readBytes(file));
    if (content !== null && hasMachineSpecificPath(content)) findings.push(file);
  }
  return findings;
}

function hasMachineSpecificPath(content) {
  if (pathPatterns.some((pattern) => pattern.test(content))) return true;
  return [...content.matchAll(posixPathPattern)].some(([match]) => {
    const path = match.slice(match.indexOf("/")).replace(/[.,!?`]+$/u, "");
    return !containerPathRoots.some((root) => path === root || path.startsWith(`${root}/`));
  });
}

function decodeText(bytes) {
  if (bytes.includes(0)) return null;
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
  return text;
}
