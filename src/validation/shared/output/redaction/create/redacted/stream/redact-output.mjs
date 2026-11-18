import redactProcessOutput from "../../../redact/process-output.mjs";
import redactMatchedSecrets from "../../../redact/secrets.mjs";
export default function redactStreamOutput(text, matchEnds) {
  return redactProcessOutput(redactMatchedSecrets(text, matchEnds), []);
}
