export const ignoredDirectories = new Set([".git", "node_modules", "coverage", "build", "dist", "target"]);

const forbiddenName = /(?:^|[._-])(?:credentials?|secrets?|tokens?|keys?|sessions?|decrypted(?:[-_ ]data)?|private[-_ ]?conversations?|backups?|dumps?|restores?|runtime[-_ ]?state|(?:database|db)[-_ ]?state|id_(?:rsa|dsa|ecdsa|ed25519)|authorized_keys)(?:$|[._-])/i;
const forbiddenExtension = /(?:^|\/)\.env(?:\.[^/]+)?$|\.(?:pem|key|p12|pfx|bak|dump|dmp|sql\.gz|tar\.gz|sqlite3?|db(?:-(?:wal|shm))?|session)$/i;
const benignSecurityPaths = new Set([
  "src/checks/collect-redaction-secrets.mjs",
  "src/checks/general/E-0.1/E-0.1.10/knit-command-tokens.mjs",
  "src/checks/redact-credential-fields.mjs",
  "src/checks/redact-http-credentials.mjs",
  "src/checks/redact-known-token-formats.mjs",
  "src/checks/create-bounded-secret-search.mjs",
  "src/checks/create-partial-secret-suffix-trimmer.mjs",
  "src/checks/create-secret-text-matcher.mjs",
  "src/checks/redact-secrets.mjs",
  "tests/checks/collect-redaction-secrets.test.mjs",
  "tests/checks/general/E-0.1/E-0.1.10/knit-command-tokens.test.mjs",
  "tests/checks/redact-credential-fields.test.mjs",
  "tests/checks/redact-http-credentials.test.mjs",
  "tests/checks/redact-known-token-formats.test.mjs",
  "tests/checks/create-bounded-secret-search.test.mjs",
  "tests/checks/create-partial-secret-suffix-trimmer.test.mjs",
  "tests/checks/create-secret-text-matcher.test.mjs",
  "tests/checks/redact-secrets.test.mjs",
].map((path) => path.toLowerCase()));

export function isForbiddenPath(path) {
  const normalized = path.replaceAll("\\", "/");
  if (normalized === ".env" || normalized === ".env.example") return false;
  const parts = normalized.split("/");
  const benignSecurityCode = benignSecurityPaths.has(normalized.toLowerCase());
  const fileName = parts.at(-1);
  const hasForbiddenName =
    parts.slice(0, -1).some((part) => forbiddenName.test(part)) ||
    (forbiddenName.test(fileName) && !benignSecurityCode);
  if (forbiddenExtension.test(normalized)) return true;
  return hasForbiddenName && !benignSecurityCode;
}
