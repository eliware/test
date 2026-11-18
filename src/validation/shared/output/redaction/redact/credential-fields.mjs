import redactCredentialAssignments from "./credential-fields/assignments.mjs";
import redactPrivateKeys from "./credential-fields/private-keys.mjs";
export default function redactCredentialFields(text) {
  return redactCredentialAssignments(redactPrivateKeys(text));
}
