const sensitiveEnvironmentKey =
  /(?:password|passwd|pwd|token|secret|credential|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?(?:secret|id)|refresh[_-]?token|session[_-]?id)/iu;
const MIN_REDACTION_SECRET_LENGTH = 8;

export function collectRedactionSecrets(environment) {
  if (!environment || typeof environment !== "object") return [];
  return [
    ...new Set(
      Object.entries(environment)
        .filter(
          ([key, value]) =>
            sensitiveEnvironmentKey.test(key) &&
            typeof value === "string" &&
            value.length >= MIN_REDACTION_SECRET_LENGTH,
        )
        .map(([, value]) => value),
    ),
  ].sort((left, right) => right.length - left.length);
}
