import { parseEnvironmentAssignments } from "./parse-environment-assignments.mjs";

const ownerVariable = "MAIL_OWNER_ADDRESS";

export function validateMailboxOwner(content, expected) {
  const owners = parseEnvironmentAssignments(content).filter(([name]) => name === ownerVariable);
  return owners.length === 1 && owners[0][1] === expected;
}
