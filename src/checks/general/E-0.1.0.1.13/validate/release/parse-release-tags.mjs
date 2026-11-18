export default function parseReleaseTags(stdout) {
  return new Set(String(stdout).split(/\r?\n/u));
}
