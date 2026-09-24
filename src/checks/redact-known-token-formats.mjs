export function redactKnownTokenFormats(text) {
  return String(text)
    .replace(/((?:^|[\s,{])(?:AWS_SECRET_ACCESS_KEY|NPM_TOKEN|GH_TOKEN|CI_JOB_TOKEN)\s*=\s*)[^\s,;}]+/gimu, "$1[REDACTED]")
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|npm_[A-Za-z0-9_]+|pypi-[A-Za-z0-9_-]+|sk-[A-Za-z0-9_-]+|xox[baprs]-[A-Za-z0-9_-]+|AIza[0-9A-Za-z_-]{20,}|AKIA[0-9A-Z]{16})\b/gu, "[REDACTED]")
    .replace(/\bssh-(?:rsa|ed25519)\s+[A-Za-z0-9+/=]+(?:\s+\S+)?/gu, "[REDACTED]")
    .replace(/\b(?=[A-F0-9]*[0-9])[A-F0-9]{32,}\b/gu, "[REDACTED]")
    .replace(/\b(?=[A-Za-z0-9+/]{32,}={0,2}\b)(?=[A-Za-z0-9+/]*[0-9])[A-Za-z0-9+/]{32,}={0,2}\b/gu, "[REDACTED]")
    .replace(/(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/gu, "[REDACTED]");
}
