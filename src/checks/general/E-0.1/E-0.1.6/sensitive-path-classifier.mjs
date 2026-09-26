export const ignoredDirectories = new Set([".git", "node_modules", "coverage", "build", "dist", "target"]);

const forbiddenName = /(?:^|[._-])(?:credentials?|secrets?|tokens?|keys?|sessions?|decrypted(?:[-_ ]data)?|private[-_ ]?conversations?|backups?|dumps?|restores?|runtime[-_ ]?state|(?:database|db)[-_ ]?state|id_(?:rsa|dsa|ecdsa|ed25519)|authorized_keys)(?:$|[._-])/i;
const forbiddenExtension = /(?:^|\/)\.env(?:\.[^/]+)?$|\.(?:pem|key|p12|pfx|bak|dump|dmp|sql\.gz|tar\.gz|sqlite3?|db(?:-(?:wal|shm))?|session)$/i;

export function isForbiddenPath(path) {
  const normalized = path.replaceAll("\\", "/");
  if (normalized.split("/").at(-1) === ".env.example") return false;
  const file = normalized.split("/").at(-1);
  const isSourceModule = /\.(?:cjs|js|jsx|mjs|ts|tsx)$/iu.test(file);
  return (!isSourceModule && normalized.split("/").some((part) => forbiddenName.test(part))) || forbiddenExtension.test(normalized);
}
