import redactCompleteOutput from "../../../redact/complete-output.mjs";
export default function createCompleteOutputRedactor(policy) {
  return (text) => redactCompleteOutput(text, policy);
}
