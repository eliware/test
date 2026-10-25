import { truncateRedactedOutput } from "../../../truncate-redacted-output.mjs";
import { truncateOutputTextToBytes } from "../../output-byte-budget.mjs";
import { redactStreamOutput } from "./redact-output.mjs";

export function appendRedactedOutput(text, matchEnds, budget) {
  const redacted = redactStreamOutput(text, matchEnds);
  const byteBounded = truncateOutputTextToBytes(redacted, budget.remaining);
  const output = truncateRedactedOutput(redacted, byteBounded.text.length);
  return budget.append("stdout", output);
}
