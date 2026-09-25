import { bundledDirectiveAuthority } from "./read-bundled-profile-authority.mjs";

function indent(text, prefix) {
  return text
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

export function formatConventionFailure(
  { ruleId, message = "" },
  authority = bundledDirectiveAuthority,
) {
  const description = message || "The check failed without a diagnostic.";
  const rule = authority.rules?.[ruleId];
  if (!rule) {
    return `${ruleId}: ${description}\n  Rule: No bundled convention rule was found for this check.`;
  }

  return `${ruleId}: ${description}\n  Rule:\n${indent(JSON.stringify(rule, null, 2), "    ")}`;
}
