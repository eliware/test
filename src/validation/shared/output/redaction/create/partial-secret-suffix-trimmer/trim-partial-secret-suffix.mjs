import createPartialSecretSuffixTrimmer from "../partial-secret-suffix-trimmer.mjs";
function trimPartialSecretSuffix(text, secrets) {
  return createPartialSecretSuffixTrimmer(secrets)(text);
}
export default trimPartialSecretSuffix;
