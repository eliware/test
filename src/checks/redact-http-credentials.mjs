const credentialKey = "(?:password|passwd|pwd|token|secret|credential|api[_-]?key|apiKey|access[_-]?key|accessKey|private[_-]?key|privateKey|client[_-]?(?:secret|id)|client(?:Secret|Id)|refresh[_-]?token|refreshToken|session[_-]?id|sessionId)";

export function redactHttpCredentials(text) {
  return String(text)
    .replace(/((?:authorization|proxy-authorization)\s*:\s*(?:bearer|basic)\s+)[^\s,;}]+/giu, "$1[REDACTED]")
    .replace(/((?:authorization|proxy-authorization)\s*:\s+\[REDACTED\]\s+)[^\s,;}]+/giu, "$1[REDACTED]")
    .replace(/((?:bearer|basic)\s+)[A-Za-z0-9+/=_-]{8,}/giu, "$1[REDACTED]")
    .replace(new RegExp(`([?&](?:${credentialKey})=)[^&#\\s]+`, "giu"), "$1[REDACTED]")
    .replace(/(https?:\/\/)[^\s/@:]+(?::[^\s/@]+)?@/giu, "$1[REDACTED]@")
    .replace(/((?:x-api-key|x-auth-token|x-access-token)\s*:\s*)[^\s,;}]+/giu, "$1[REDACTED]")
    .replace(/((?:cookie|set-cookie)\s*:\s*)[^\r\n]+/giu, "$1[REDACTED]");
}
