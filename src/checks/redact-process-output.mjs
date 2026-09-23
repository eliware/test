const credentialKey = "(?:password|passwd|pwd|token|secret|credential|api[_-]?key|apiKey|access[_-]?key|accessKey|private[_-]?key|privateKey|client[_-]?(?:secret|id)|client(?:Secret|Id)|refresh[_-]?token|refreshToken|session[_-]?id|sessionId)";

const sensitiveEnvironmentKey = /(?:password|passwd|pwd|token|secret|credential|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?(?:secret|id)|refresh[_-]?token|session[_-]?id)/iu;

export function collectRedactionSecrets(environment) {
  if (!environment || typeof environment !== "object") return [];
  return [...new Set(Object.entries(environment)
    .filter(([key, value]) => sensitiveEnvironmentKey.test(key) && typeof value === "string" && value.length > 0)
    .map(([, value]) => value))]
    .sort((left, right) => right.length - left.length);
}

export function redactProcessOutput(text, secrets = []) {
  let output = String(text);
  for (const secret of secrets) {
    if (typeof secret === "string" && secret.length > 0) output = output.split(secret).join("[REDACTED]");
  }
  return output
    .replace(/-----BEGIN(?: RSA| OPENSSH| EC)? PRIVATE KEY-----[\s\S]*?-----END(?: RSA| OPENSSH| EC)? PRIVATE KEY-----/gu, "[REDACTED PRIVATE KEY]")
    .replace(new RegExp(`(["']?(?:${credentialKey})["']?\\s*[=:]\\s*)['"][\\s\\S]*?['"]`, "giu"), "$1[REDACTED]")
    .replace(new RegExp(`(["']?(?:${credentialKey})["']?\\s*[=:]\\s*)(?:"(?:\\\\.|[^"\\\\])*"|'[^']*'|[^\\s,;}]+)`, "giu"), "$1[REDACTED]")
    .replace(/((?:authorization|proxy-authorization)\s*:\s*(?:bearer|basic)\s+)[^\s,;}]+/giu, "$1[REDACTED]")
    .replace(/((?:authorization|proxy-authorization)\s*:\s+\[REDACTED\]\s+)[^\s,;}]+/giu, "$1[REDACTED]")
    .replace(new RegExp(`((?:${credentialKey})\\s+)(?:"[^"]*"|'[^']*'|[^\\s,;}]+)`, "giu"), "$1[REDACTED]")
    .replace(/((?:bearer|basic)\s+)[A-Za-z0-9+/=_-]{8,}/giu, "$1[REDACTED]")
    .replace(new RegExp(`([?&](?:${credentialKey})=)[^&#\\s]+`, "giu"), "$1[REDACTED]")
    .replace(/(https?:\/\/)[^\s/@:]+(?::[^\s/@]+)?@/giu, "$1[REDACTED]@")
    .replace(/((?:x-api-key|x-auth-token|x-access-token)\s*:\s*)[^\s,;}]+/giu, "$1[REDACTED]")
    .replace(/((?:cookie|set-cookie)\s*:\s*)[^\r\n]+/giu, "$1[REDACTED]")
    .replace(/((?:^|[\s,{])(?:AWS_SECRET_ACCESS_KEY|NPM_TOKEN|GH_TOKEN|CI_JOB_TOKEN)\s*=\s*)[^\s,;}]+/gimu, "$1[REDACTED]")
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|npm_[A-Za-z0-9_]+|pypi-[A-Za-z0-9_-]+|sk-[A-Za-z0-9_-]+|xox[baprs]-[A-Za-z0-9_-]+|AIza[0-9A-Za-z_-]{20,}|AKIA[0-9A-Z]{16})\b/gu, "[REDACTED]")
    .replace(/\bssh-(?:rsa|ed25519)\s+[A-Za-z0-9+/=]+(?:\s+\S+)?/gu, "[REDACTED]")
    .replace(/\b(?=[A-F0-9]*[0-9])[A-F0-9]{32,}\b/gu, "[REDACTED]")
    .replace(/\b(?=[A-Za-z0-9+/]{32,}={0,2}\b)(?=[A-Za-z0-9+/]*[0-9])[A-Za-z0-9+/]{32,}={0,2}\b/gu, "[REDACTED]")
    .replace(/(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/gu, "[REDACTED]")
    ;
}
