import validateAuditArguments from "./validate-audit-arguments.mjs";
export default function buildAuditArguments(extraArgs = []) {
  const error = validateAuditArguments(extraArgs);
  if (error) throw new Error(error);
  return ["audit", ...extraArgs, "--omit=dev", "--json", "--audit-level=high"];
}
