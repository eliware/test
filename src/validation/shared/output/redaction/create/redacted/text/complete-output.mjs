import { redactCompleteOutput } from "../../../redact/complete-output.mjs";

export function createCompleteOutputRedactor(policy) {
  return (text) => redactCompleteOutput(text, policy);
}
