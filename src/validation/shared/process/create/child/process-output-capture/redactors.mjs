import createRedactedTextStream from "../../../../output/redaction/create/redacted/text/stream.mjs";
import createSecretTextMatcher from "../../../../output/redaction/create/secret-text-matcher.mjs";
export default function createLazyChildProcessRedactors(
  redactionSecrets,
  outputLimit,
  maxPendingLength,
  makeSecretMatcher = createSecretTextMatcher,
  createTextStream = createRedactedTextStream,
) {
  let redactors;
  const getSecretMatcher = (secrets, options) => makeSecretMatcher(secrets, options);
  return {
    get() {
      if (!redactors) {
        redactors = {
          stdout: createTextStream(redactionSecrets, outputLimit, {
            maxPendingLength,
            getSecretMatcher,
          }),
          stderr: createTextStream(redactionSecrets, outputLimit, {
            maxPendingLength,
            getSecretMatcher,
          }),
        };
      }
      return redactors;
    },
    isInitialized() {
      return Boolean(redactors);
    },
  };
}
